'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient, getSessionUser } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import {
  addressSchema,
  cartItemSchema,
  checkoutSchema,
  reviewSchema,
  ticketReplySchema,
  ticketSchema,
  zodToFormState,
  type FormState,
} from '@/lib/validation';
import { audit } from '@/lib/security/console';
import { buildPaymeCheckoutUrl } from '@/lib/payments/payme';
import { buildClickCheckoutUrl } from '@/lib/payments/click';
import { publicEnv, serverEnv } from '@/lib/env';

async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  return user;
}

async function getOrCreateCartId(userId: string): Promise<string> {
  const client = serviceClient();
  const { data: existing } = await client.from('carts').select('id').eq('user_id', userId).maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await client.from('carts').insert({ user_id: userId }).select('id').single();
  if (error) throw new Error(error.message);
  return data.id as string;
}

export async function addToCart(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = cartItemSchema.safeParse({
    product_id: formData.get('product_id'),
    quantity: formData.get('quantity') ?? 1,
  });
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = serviceClient();
  const { data: product } = await client
    .from('products')
    .select('id, stock, reserved, max_per_order, is_active')
    .eq('id', parsed.data.product_id)
    .maybeSingle();

  if (!product || !product.is_active) return { ok: false, message: 'Mahsulot topilmadi' };

  const cartId = await getOrCreateCartId(user.id);
  const { data: existing } = await client
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cartId)
    .eq('product_id', product.id)
    .maybeSingle();

  const nextQuantity = (existing?.quantity ?? 0) + parsed.data.quantity;
  const available = product.stock - product.reserved;
  if (nextQuantity > Math.min(available, product.max_per_order)) {
    return { ok: false, message: `Mavjud miqdor: ${Math.max(0, Math.min(available, product.max_per_order))} dona` };
  }

  if (existing) {
    await client.from('cart_items').update({ quantity: nextQuantity }).eq('id', existing.id);
  } else {
    await client.from('cart_items').insert({ cart_id: cartId, product_id: product.id, quantity: nextQuantity });
  }

  revalidatePath('/cart');
  return { ok: true, message: "Savatga qo'shildi" };
}

export async function setCartQuantity(formData: FormData): Promise<void> {
  const user = await requireUser();
  const parsed = cartItemSchema.safeParse({
    product_id: formData.get('product_id'),
    quantity: formData.get('quantity'),
  });
  if (!parsed.success) return;

  const client = serviceClient();
  const cartId = await getOrCreateCartId(user.id);
  await client
    .from('cart_items')
    .update({ quantity: parsed.data.quantity })
    .eq('cart_id', cartId)
    .eq('product_id', parsed.data.product_id);
  revalidatePath('/cart');
}

export async function removeCartItem(formData: FormData): Promise<void> {
  const user = await requireUser();
  const productId = String(formData.get('product_id') ?? '');
  const client = serviceClient();
  const cartId = await getOrCreateCartId(user.id);
  await client.from('cart_items').delete().eq('cart_id', cartId).eq('product_id', productId);
  revalidatePath('/cart');
}

export async function saveAddress(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = addressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const supabase = await createClient();
  const payload = {
    user_id: user.id,
    zone_id: parsed.data.zone_id,
    label: parsed.data.label ?? null,
    recipient_name: parsed.data.recipient_name,
    phone: parsed.data.phone,
    line1: parsed.data.line1,
    landmark: parsed.data.landmark ?? null,
    lat: parsed.data.lat ?? null,
    lng: parsed.data.lng ?? null,
    is_default: parsed.data.is_default ?? false,
  };

  const { data: saved, error } = parsed.data.id
    ? await supabase.from('addresses').update(payload).eq('id', parsed.data.id).select('id').single()
    : await supabase.from('addresses').insert(payload).select('id').single();

  if (error) return { ok: false, message: error.message };

  if (payload.is_default) {
    // Scoped to the owner and to the row that was just saved, otherwise a new
    // default leaves the previous one flagged as well.
    await supabase
      .from('addresses')
      .update({ is_default: false })
      .eq('user_id', user.id)
      .neq('id', saved.id);
  }

  revalidatePath('/checkout');
  revalidatePath('/profile');
  return { ok: true, message: 'Manzil saqlandi' };
}

export async function placeOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = checkoutSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = serviceClient();
  // Idempotency: repeated submits of the same checkout reuse the same order.
  const idempotencyKey = `${user.id}:${formData.get('idempotency_key') ?? ''}`;

  const { data: orderId, error } = await client.rpc('create_order_from_cart', {
    p_user_id: user.id,
    p_address_id: parsed.data.address_id,
    p_provider: parsed.data.provider,
    p_promo_code: parsed.data.promo_code ?? null,
    p_note: parsed.data.note ?? null,
    p_idempotency_key: idempotencyKey,
  });

  if (error || !orderId) {
    const map: Record<string, string> = {
      cart_empty: "Savat bo'sh",
      address_not_found: 'Manzil topilmadi',
      zone_not_found: 'Yetkazib berish hududi topilmadi',
      promo_invalid: 'Promo-kod yaroqsiz',
    };
    const raw = error?.message ?? 'unknown';
    const key = Object.keys(map).find((k) => raw.includes(k));
    if (raw.includes('out_of_stock')) return { ok: false, message: 'Mahsulot omborda yetarli emas' };
    if (raw.includes('quantity_limit')) return { ok: false, message: 'Bitta buyurtmadagi limit oshib ketdi' };
    return { ok: false, message: key ? map[key] : `Buyurtma yaratilmadi: ${raw}` };
  }

  await audit({ actorId: user.id, actorEmail: user.email, action: 'order.create', entity: 'orders', entityId: String(orderId) });

  revalidatePath('/cart');
  revalidatePath('/orders');
  redirect(`/orders/${orderId}?created=1`);
}

/** Builds the provider redirect for an unpaid order (amount read from the DB). */
export async function startPayment(orderId: string): Promise<{ url?: string; message?: string }> {
  const user = await requireUser();
  const client = serviceClient();
  const { data: order } = await client
    .from('orders')
    .select('id, user_id, total, payment_provider, payment_status')
    .eq('id', orderId)
    .maybeSingle();

  if (!order || order.user_id !== user.id) return { message: 'Buyurtma topilmadi' };
  if (order.payment_status === 'paid') return { message: "Buyurtma allaqachon to'langan" };

  const env = serverEnv();
  if (order.payment_provider === 'payme') {
    if (!env.payme.merchantId) return { message: "Payme sozlamalari to'liq emas" };
    return {
      url: buildPaymeCheckoutUrl({
        merchantId: env.payme.merchantId,
        orderId: order.id,
        amountUzs: order.total,
        returnUrl: `${publicEnv.siteUrl}/orders/${order.id}`,
        baseUrl: env.payme.checkoutUrl,
      }),
    };
  }

  if (order.payment_provider === 'click') {
    if (!env.click.serviceId || !env.click.merchantId) return { message: "Click sozlamalari to'liq emas" };
    return {
      url: buildClickCheckoutUrl({
        serviceId: env.click.serviceId,
        merchantId: env.click.merchantId,
        orderId: order.id,
        amountUzs: order.total,
        returnUrl: `${publicEnv.siteUrl}/orders/${order.id}`,
      }),
    };
  }

  return { message: "Bu buyurtma naqd to'lov bilan rasmiylashtirilgan" };
}

export async function createTicket(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const raw = Object.fromEntries(formData);
  const parsed = ticketSchema.safeParse({ ...raw, order_id: raw.order_id || undefined });
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = serviceClient();
  const { data: ticket, error } = await client
    .from('tickets')
    .insert({
      user_id: user.id,
      order_id: parsed.data.order_id ?? null,
      kind: parsed.data.kind,
      subject: parsed.data.subject,
    })
    .select('id')
    .single();

  if (error) return { ok: false, message: error.message };

  await client.from('ticket_messages').insert({
    ticket_id: ticket.id,
    author_id: user.id,
    is_staff: false,
    body: parsed.data.body,
  });

  await client.from('notifications').insert({
    user_id: null,
    title: 'Yangi murojaat',
    body: parsed.data.subject,
    link: `/__console/tickets/${ticket.id}`,
    is_admin_only: true,
  });

  revalidatePath('/support');
  return { ok: true, message: 'Murojaatingiz qabul qilindi' };
}

export async function replyTicket(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = ticketReplySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from('ticket_messages').insert({
    ticket_id: parsed.data.ticket_id,
    author_id: user.id,
    is_staff: false,
    body: parsed.data.body,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/support/${parsed.data.ticket_id}`);
  return { ok: true };
}

export async function submitReview(_prev: FormState, formData: FormData): Promise<FormState> {
  const user = await requireUser();
  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = serviceClient();
  // Only buyers of a delivered order may review.
  const { data: purchased } = await client
    .from('order_items')
    .select('order_id, orders!inner(user_id, status)')
    .eq('product_id', parsed.data.product_id)
    .eq('orders.user_id', user.id)
    .in('orders.status', ['delivered', 'completed'])
    .limit(1);

  if (!purchased || purchased.length === 0) {
    return { ok: false, message: 'Sharh qoldirish uchun mahsulotni sotib olgan bo\'lishingiz kerak' };
  }

  const { error } = await client.from('reviews').upsert(
    {
      product_id: parsed.data.product_id,
      user_id: user.id,
      rating: parsed.data.rating,
      body: parsed.data.body ?? null,
      is_approved: false,
    },
    { onConflict: 'product_id,user_id' },
  );
  if (error) return { ok: false, message: error.message };

  return { ok: true, message: 'Sharh moderatsiyaga yuborildi' };
}

/** Clears the unread badge for the signed-in customer. */
export async function markNotificationsRead(): Promise<void> {
  const user = await requireUser();
  await serviceClient()
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', user.id)
    .is('read_at', null);
  revalidatePath('/notifications');
}
