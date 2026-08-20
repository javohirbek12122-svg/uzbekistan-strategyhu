'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { toDataURL } from 'qrcode';
import { createClient } from '@/lib/supabase/server';
import { requireServiceClient } from '@/lib/supabase/service';
import { CATALOG_TAG } from '@/server/queries';
import {
  consoleLoginSchema,
  orderStatusSchema,
  productSchema,
  roleSchema,
  settingSchema,
  ticketReplySchema,
  zoneSchema,
  zodToFormState,
  type FormState,
} from '@/lib/validation';
import {
  audit,
  consumeRecoveryCode,
  enrollMfa,
  getMfa,
  getSecuritySettings,
  hasAdminRole,
  isEmailAllowlisted,
  isIpAllowed,
  isLockedOut,
  issueConsoleSession,
  recordLoginAttempt,
  requestMeta,
  requireAdmin,
  requireConsole,
  revokeConsoleSession,
  verifyTotp,
} from '@/lib/security/console';

const CONSOLE = '/__console';

/**
 * Console sign-in. Requires, in order: allow-listed e-mail, not locked out,
 * IP allowed, valid password, privileged role, and a valid TOTP (or recovery)
 * code. Every attempt is recorded.
 */
export async function consoleLogin(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = consoleLoginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const { email, password } = parsed.data;
  const { ip } = await requestMeta();
  const genericError: FormState = { ok: false, message: "Kirish ma'lumotlari xato" };

  if (await isLockedOut(email)) {
    return { ok: false, message: 'Juda ko\'p urinish. Birozdan keyin qayta urinib ko\'ring.' };
  }
  if (!(await isEmailAllowlisted(email))) {
    await recordLoginAttempt(email, false, ip);
    await audit({ actorEmail: email, action: 'console.login.not_allowlisted' });
    return genericError;
  }
  if (!(await isIpAllowed(ip))) {
    await recordLoginAttempt(email, false, ip);
    await audit({ actorEmail: email, action: 'console.login.ip_blocked' });
    return genericError;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    await recordLoginAttempt(email, false, ip);
    await audit({ actorEmail: email, action: 'console.login.bad_password' });
    return genericError;
  }

  if (!(await hasAdminRole(data.user.id))) {
    await supabase.auth.signOut();
    await recordLoginAttempt(email, false, ip);
    await audit({ actorId: data.user.id, actorEmail: email, action: 'console.login.no_role' });
    return genericError;
  }

  // Second factor: when MFA is required (default), verify a TOTP code or a
  // recovery code before issuing the console session. Without this gate the
  // entire MFA infrastructure (enrolment, TOTP, replay protection) is dead
  // code and the console is protected by password alone.
  const security = await getSecuritySettings();
  if (security.require_mfa) {
    const mfa = await getMfa(data.user.id);
    if (!mfa) {
      await supabase.auth.signOut();
      await recordLoginAttempt(email, false, ip);
      return {
        ok: false,
        message: 'Autentifikator ulanmagan. Avval /auth/login orqali kiring va quyidagi bo‘limda kodni ulang.',
      };
    }
    const code = parsed.data.token?.trim() ?? '';
    if (!code) {
      await recordLoginAttempt(email, false, ip);
      return { ok: false, message: 'Autentifikator kodini kiriting.' };
    }
    const totpOk = await verifyTotp(data.user.id, code);
    const recoveryOk = !totpOk && (await consumeRecoveryCode(data.user.id, code));
    if (!totpOk && !recoveryOk) {
      await recordLoginAttempt(email, false, ip);
      await audit({ actorId: data.user.id, actorEmail: email, action: 'console.login.bad_mfa' });
      return { ok: false, message: 'Kod noto‘g‘ri yoki muddati tugagan.' };
    }
  }

  await issueConsoleSession(data.user.id);
  await recordLoginAttempt(email, true, ip);
  await audit({ actorId: data.user.id, actorEmail: email, action: 'console.login.success' });
  redirect(CONSOLE);
}

export async function consoleLogout(): Promise<void> {
  const identity = await requireConsole().catch(() => null);
  await revokeConsoleSession();
  const supabase = await createClient();
  await supabase.auth.signOut();
  if (identity) {
    await audit({ actorId: identity.userId, actorEmail: identity.email, action: 'console.logout' });
  }
  redirect(`${CONSOLE}/login`);
}

/**
 * First-time TOTP enrolment. Allowed only for an allow-listed, privileged user
 * that has no confirmed authenticator yet (so it cannot be used to reset MFA).
 */
export async function startMfaEnrolment(): Promise<
  | { ok: true; secret: string; otpauthUrl: string; qrDataUrl: string; recoveryCodes: string[] }
  | { ok: false; message: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return { ok: false, message: 'Avval tizimga kiring' };
  if (!(await isEmailAllowlisted(user.email))) return { ok: false, message: 'Ruxsat yo\'q' };
  if (!(await hasAdminRole(user.id))) return { ok: false, message: 'Ruxsat yo\'q' };

  const { data: existing } = await requireServiceClient()
    .from('admin_mfa')
    .select('confirmed_at')
    .eq('user_id', user.id)
    .maybeSingle();
  if (existing?.confirmed_at) {
    return { ok: false, message: 'Autentifikator allaqachon ulangan. Qayta ulash uchun DB orqali tiklang.' };
  }

  const enrolment = await enrollMfa(user.id, user.email);
  const qrDataUrl = await toDataURL(enrolment.otpauthUrl, { width: 220, margin: 1 });
  await audit({ actorId: user.id, actorEmail: user.email, action: 'console.mfa.enroll' });
  return { ok: true, qrDataUrl, ...enrolment };
}

// ---------------------------------------------------------------------------
// Catalog
// ---------------------------------------------------------------------------
export async function saveProduct(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireConsole();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = requireServiceClient();
  const { image_url, id, ...fields } = parsed.data;
  const payload = {
    ...fields,
    category_id: fields.category_id || null,
    brand_id: fields.brand_id || null,
    compare_at_price: fields.compare_at_price || null,
    name_ru: fields.name_ru || null,
    description_uz: fields.description_uz || null,
    is_active: fields.is_active ?? false,
    is_featured: fields.is_featured ?? false,
  };

  let productId = id;
  if (id) {
    const { data: before } = await client.from('products').select('*').eq('id', id).maybeSingle();
    const { error } = await client.from('products').update(payload).eq('id', id);
    if (error) return { ok: false, message: error.message };
    await audit({
      actorId: identity.userId,
      actorEmail: identity.email,
      action: 'product.update',
      entity: 'products',
      entityId: id,
      before,
      after: payload,
    });
  } else {
    const { data, error } = await client.from('products').insert(payload).select('id').single();
    if (error) return { ok: false, message: error.message };
    productId = data.id as string;
    await audit({
      actorId: identity.userId,
      actorEmail: identity.email,
      action: 'product.create',
      entity: 'products',
      entityId: productId,
      after: payload,
    });
  }

  if (image_url && productId) {
    await client.from('product_images').insert({ product_id: productId, url: image_url, position: 0 });
  }

  revalidatePath(`${CONSOLE}/products`);
  revalidateTag(CATALOG_TAG);
  return { ok: true, message: 'Saqlandi' };
}

export async function toggleProduct(formData: FormData): Promise<void> {
  const identity = await requireConsole();
  const id = String(formData.get('id') ?? '');
  const client = requireServiceClient();
  const { data } = await client.from('products').select('is_active').eq('id', id).maybeSingle();
  if (!data) return;
  await client.from('products').update({ is_active: !data.is_active }).eq('id', id);
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'product.toggle',
    entity: 'products',
    entityId: id,
    before: data,
    after: { is_active: !data.is_active },
  });
  revalidatePath(`${CONSOLE}/products`);
  revalidateTag(CATALOG_TAG);
}

export async function deleteProduct(formData: FormData): Promise<void> {
  const identity = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  const client = requireServiceClient();
  const { data: before } = await client.from('products').select('*').eq('id', id).maybeSingle();
  // Products referenced by orders are archived instead of deleted.
  const { count } = await client.from('order_items').select('id', { count: 'exact', head: true }).eq('product_id', id);
  if ((count ?? 0) > 0) {
    await client.from('products').update({ is_active: false }).eq('id', id);
  } else {
    await client.from('products').delete().eq('id', id);
  }
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: (count ?? 0) > 0 ? 'product.archive' : 'product.delete',
    entity: 'products',
    entityId: id,
    before,
  });
  revalidatePath(`${CONSOLE}/products`);
  revalidateTag(CATALOG_TAG);
}

// ---------------------------------------------------------------------------
// Orders & logistics
// ---------------------------------------------------------------------------
export async function updateOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireConsole();
  const parsed = orderStatusSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = requireServiceClient();
  const { data: before } = await client
    .from('orders')
    .select('status, payment_status')
    .eq('id', parsed.data.order_id)
    .maybeSingle();

  const { error } = await client
    .from('orders')
    .update({ status: parsed.data.status })
    .eq('id', parsed.data.order_id);
  if (error) {
    return { ok: false, message: `Holatni o'zgartirish mumkin emas: ${before?.status} → ${parsed.data.status}` };
  }

  if (parsed.data.comment) {
    await client
      .from('order_status_history')
      .update({ comment: parsed.data.comment, changed_by: identity.userId })
      .eq('order_id', parsed.data.order_id)
      .eq('to_status', parsed.data.status);
  }

  const { data: order } = await client
    .from('orders')
    .select('user_id, order_number')
    .eq('id', parsed.data.order_id)
    .maybeSingle();
  if (order) {
    await client.from('notifications').insert({
      user_id: order.user_id,
      title: 'Buyurtma holati yangilandi',
      body: `${order.order_number}: ${parsed.data.status}`,
      link: `/orders/${parsed.data.order_id}`,
    });
  }

  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'order.status',
    entity: 'orders',
    entityId: parsed.data.order_id,
    before,
    after: { status: parsed.data.status },
  });

  revalidatePath(`${CONSOLE}/orders`);
  revalidatePath(`${CONSOLE}/orders/${parsed.data.order_id}`);
  return { ok: true, message: 'Holat yangilandi' };
}

export async function assignCourier(formData: FormData): Promise<void> {
  const identity = await requireConsole();
  const orderId = String(formData.get('order_id') ?? '');
  const courierId = String(formData.get('courier_id') ?? '');
  const client = requireServiceClient();
  await client
    .from('shipments')
    .update({ courier_id: courierId || null, status: courierId ? 'assigned' : 'pending' })
    .eq('order_id', orderId);
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'shipment.assign',
    entity: 'shipments',
    entityId: orderId,
    after: { courier_id: courierId },
  });
  revalidatePath(`${CONSOLE}/orders/${orderId}`);
  revalidatePath(`${CONSOLE}/delivery`);
}

export async function saveZone(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireConsole();
  const parsed = zoneSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);
  if (parsed.data.max_fee < parsed.data.base_fee) {
    return { ok: false, message: "Maksimal narx bazadan kichik bo'lmasligi kerak" };
  }

  const client = requireServiceClient();
  const { id, ...payload } = parsed.data;
  const { error } = id
    ? await client.from('delivery_zones').update(payload).eq('id', id)
    : await client.from('delivery_zones').insert(payload);
  if (error) return { ok: false, message: error.message };

  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: id ? 'zone.update' : 'zone.create',
    entity: 'delivery_zones',
    entityId: id,
    after: payload,
  });
  revalidatePath(`${CONSOLE}/delivery`);
  revalidateTag(CATALOG_TAG);
  return { ok: true, message: 'Hudud saqlandi' };
}

export async function runLateCompensations(): Promise<void> {
  const identity = await requireConsole();
  const { data } = await requireServiceClient().rpc('apply_late_compensations');
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'sla.compensations',
    after: { applied: data },
  });
  revalidatePath(`${CONSOLE}/delivery`);
}

export async function refundOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireAdmin();
  const orderId = String(formData.get('order_id') ?? '');
  const reason = String(formData.get('reason') ?? '');
  const client = requireServiceClient();

  const { data: payment } = await client
    .from('payments')
    .select('id, amount, status')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!payment) return { ok: false, message: "To'lov topilmadi" };

  const { error } = await client.rpc('cancel_payment', { p_payment_id: payment.id, p_reason: 5 });
  if (error) return { ok: false, message: error.message };

  await client.from('refunds').insert({
    order_id: orderId,
    payment_id: payment.id,
    amount: payment.amount,
    reason,
    created_by: identity.userId,
  });
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'order.refund',
    entity: 'orders',
    entityId: orderId,
    after: { amount: payment.amount, reason },
  });

  revalidatePath(`${CONSOLE}/orders/${orderId}`);
  return { ok: true, message: 'Pul qaytarish qayd etildi' };
}

// ---------------------------------------------------------------------------
// Users, support, settings
// ---------------------------------------------------------------------------
export async function setUserRole(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireAdmin();
  const parsed = roleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = requireServiceClient();
  if (parsed.data.role === 'admin' || parsed.data.role === 'manager') {
    const { data: profile } = await client.from('profiles').select('email').eq('id', parsed.data.user_id).maybeSingle();
    if (!profile?.email || !(await isEmailAllowlisted(profile.email))) {
      return { ok: false, message: 'Bu email allow-listda yo\'q — imtiyozli rol berilmaydi' };
    }
  }

  const { error } = await client
    .from('user_roles')
    .upsert({ user_id: parsed.data.user_id, role: parsed.data.role, granted_by: identity.userId });
  if (error) return { ok: false, message: error.message };

  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'user.role.grant',
    entity: 'user_roles',
    entityId: parsed.data.user_id,
    after: parsed.data,
  });
  revalidatePath(`${CONSOLE}/users`);
  return { ok: true, message: 'Rol berildi' };
}

export async function revokeUserRole(formData: FormData): Promise<void> {
  const identity = await requireAdmin();
  const userId = String(formData.get('user_id') ?? '');
  const role = String(formData.get('role') ?? '');
  if (userId === identity.userId && role === 'admin') return; // never lock yourself out
  await requireServiceClient().from('user_roles').delete().eq('user_id', userId).eq('role', role);
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'user.role.revoke',
    entity: 'user_roles',
    entityId: userId,
    before: { role },
  });
  revalidatePath(`${CONSOLE}/users`);
}

export async function toggleUserBlock(formData: FormData): Promise<void> {
  const identity = await requireConsole();
  const userId = String(formData.get('user_id') ?? '');
  const client = requireServiceClient();
  const { data } = await client.from('profiles').select('is_blocked').eq('id', userId).maybeSingle();
  if (!data) return;
  await client.from('profiles').update({ is_blocked: !data.is_blocked }).eq('id', userId);
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'user.block.toggle',
    entity: 'profiles',
    entityId: userId,
    before: data,
    after: { is_blocked: !data.is_blocked },
  });
  revalidatePath(`${CONSOLE}/users`);
}

export async function addAllowlistEmail(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireAdmin();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  if (!email.includes('@')) return { ok: false, message: 'Email xato' };
  const { error } = await requireServiceClient().from('admin_allowlist').insert({ email, note: 'console' });
  if (error) return { ok: false, message: error.message };
  await audit({ actorId: identity.userId, actorEmail: identity.email, action: 'allowlist.add', after: { email } });
  revalidatePath(`${CONSOLE}/security`);
  return { ok: true, message: "Qo'shildi" };
}

export async function removeAllowlistEmail(formData: FormData): Promise<void> {
  const identity = await requireAdmin();
  const email = String(formData.get('email') ?? '');
  if (email === identity.email) return; // never remove yourself
  await requireServiceClient().from('admin_allowlist').delete().eq('email', email);
  await audit({ actorId: identity.userId, actorEmail: identity.email, action: 'allowlist.remove', before: { email } });
  revalidatePath(`${CONSOLE}/security`);
}

/** IP allow-list. While `security.ip_allowlist_enabled` is on, only these
 * networks may reach the console login. */
export async function addIpAllowlist(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireAdmin();
  const cidr = String(formData.get('cidr') ?? '').trim();
  if (!/^[0-9a-fA-F.:]+(\/\d{1,3})?$/.test(cidr)) return { ok: false, message: "IP yoki CIDR noto'g'ri" };
  const note = String(formData.get('note') ?? '') || null;
  const { error } = await requireServiceClient().from('admin_ip_allowlist').insert({ cidr, note });
  if (error) return { ok: false, message: error.message };
  await audit({ actorId: identity.userId, actorEmail: identity.email, action: 'ip_allowlist.add', after: { cidr } });
  revalidatePath(`${CONSOLE}/security`);
  return { ok: true, message: "Qo'shildi" };
}

export async function removeIpAllowlist(formData: FormData): Promise<void> {
  const identity = await requireAdmin();
  const cidr = String(formData.get('cidr') ?? '');
  await requireServiceClient().from('admin_ip_allowlist').delete().eq('cidr', cidr);
  await audit({ actorId: identity.userId, actorEmail: identity.email, action: 'ip_allowlist.remove', before: { cidr } });
  revalidatePath(`${CONSOLE}/security`);
}

/** Kills a console session (own or someone else's) — exit control. */
export async function revokeAdminSession(formData: FormData): Promise<void> {
  const identity = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  await requireServiceClient()
    .from('admin_sessions')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', id)
    .is('revoked_at', null);
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'console.session.revoke',
    entity: 'admin_sessions',
    entityId: id,
  });
  revalidatePath(`${CONSOLE}/security`);
}

export async function replyTicketAsStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireConsole();
  const parsed = ticketReplySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  const client = requireServiceClient();
  await client.from('ticket_messages').insert({
    ticket_id: parsed.data.ticket_id,
    author_id: identity.userId,
    is_staff: true,
    body: parsed.data.body,
  });
  await client.from('tickets').update({ status: 'in_progress' }).eq('id', parsed.data.ticket_id);

  const { data: ticket } = await client
    .from('tickets')
    .select('user_id, subject')
    .eq('id', parsed.data.ticket_id)
    .maybeSingle();
  if (ticket) {
    await client.from('notifications').insert({
      user_id: ticket.user_id,
      title: 'Murojaatingizga javob berildi',
      body: ticket.subject,
      link: `/support/${parsed.data.ticket_id}`,
    });
  }

  revalidatePath(`${CONSOLE}/tickets`);
  return { ok: true, message: 'Javob yuborildi' };
}

export async function setTicketStatus(formData: FormData): Promise<void> {
  const identity = await requireConsole();
  const ticketId = String(formData.get('ticket_id') ?? '');
  const status = String(formData.get('status') ?? '');
  await requireServiceClient().from('tickets').update({ status }).eq('id', ticketId);
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'ticket.status',
    entity: 'tickets',
    entityId: ticketId,
    after: { status },
  });
  revalidatePath(`${CONSOLE}/tickets`);
}

export async function moderateReview(formData: FormData): Promise<void> {
  const identity = await requireConsole();
  const id = String(formData.get('id') ?? '');
  const approve = String(formData.get('approve') ?? '') === '1';
  const client = requireServiceClient();
  if (approve) {
    await client.from('reviews').update({ is_approved: true }).eq('id', id);
  } else {
    await client.from('reviews').delete().eq('id', id);
  }
  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: approve ? 'review.approve' : 'review.reject',
    entity: 'reviews',
    entityId: id,
  });
  revalidatePath(`${CONSOLE}/reviews`);
  revalidateTag(CATALOG_TAG);
}

export async function saveSetting(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireAdmin();
  const parsed = settingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return zodToFormState(parsed.error);

  let value: unknown;
  try {
    value = JSON.parse(parsed.data.value);
  } catch {
    return { ok: false, message: "Qiymat to'g'ri JSON bo'lishi kerak" };
  }

  const client = requireServiceClient();
  const { data: before } = await client.from('settings').select('value').eq('key', parsed.data.key).maybeSingle();
  const { error } = await client
    .from('settings')
    .upsert({ key: parsed.data.key, value, updated_by: identity.userId, updated_at: new Date().toISOString() });
  if (error) return { ok: false, message: error.message };

  await audit({
    actorId: identity.userId,
    actorEmail: identity.email,
    action: 'settings.update',
    entity: 'settings',
    entityId: parsed.data.key,
    before,
    after: value,
  });
  revalidatePath(`${CONSOLE}/settings`);
  revalidateTag(CATALOG_TAG);
  return { ok: true, message: 'Sozlama saqlandi' };
}

export async function saveBanner(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireConsole();
  const title = String(formData.get('title') ?? '').trim();
  if (title.length < 3) return { ok: false, message: 'Sarlavha kiriting' };
  const payload = {
    title,
    subtitle: String(formData.get('subtitle') ?? '') || null,
    image_url: String(formData.get('image_url') ?? '') || null,
    link: String(formData.get('link') ?? '') || null,
    position: Number(formData.get('position') ?? 0),
  };
  const { error } = await requireServiceClient().from('banners').insert(payload);
  if (error) return { ok: false, message: error.message };
  await audit({ actorId: identity.userId, actorEmail: identity.email, action: 'banner.create', after: payload });
  revalidatePath(`${CONSOLE}/content`);
  revalidateTag(CATALOG_TAG);
  return { ok: true, message: 'Banner saqlandi' };
}

export async function publishNews(_prev: FormState, formData: FormData): Promise<FormState> {
  const identity = await requireConsole();
  const title = String(formData.get('title') ?? '').trim();
  const body = String(formData.get('body') ?? '').trim();
  if (title.length < 3 || body.length < 10) return { ok: false, message: "Sarlavha va matnni to'ldiring" };
  const slug = `${title
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/(^-|-$)/g, '')}-${Date.now().toString(36)}`;

  const { error } = await requireServiceClient().from('news').insert({
    slug,
    title,
    body,
    is_published: true,
    published_at: new Date().toISOString(),
  });
  if (error) return { ok: false, message: error.message };
  await audit({ actorId: identity.userId, actorEmail: identity.email, action: 'news.publish', after: { slug } });
  revalidatePath(`${CONSOLE}/content`);
  revalidateTag(CATALOG_TAG);
  return { ok: true, message: "E'lon joylandi" };
}
