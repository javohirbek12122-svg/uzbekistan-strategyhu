import 'server-only';
import { serviceClient } from '@/lib/supabase/service';
import { requireConsole } from '@/lib/security/console';
import type { AuditLogRow, Banner, Category, DeliveryZone, Order, Product, Ticket } from '@/lib/types';

const PAGE = 30;

export interface ProfileRow {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  is_blocked: boolean;
  created_at: string;
  user_roles?: { role: string }[];
}

export async function consoleProducts(search = '', page = 1) {
  await requireConsole();
  const from = (page - 1) * PAGE;
  let query = serviceClient()
    .from('products')
    .select('*, product_images(id, url, position, alt, product_id), categories(id, slug, name_uz)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE - 1);
  if (search) query = query.ilike('name_uz', `%${search.replace(/[%,]/g, '')}%`);
  const { data, count } = await query;
  return { products: (data ?? []) as unknown as Product[], total: count ?? 0, page };
}

export async function consoleProduct(id: string) {
  await requireConsole();
  const client = serviceClient();
  const [{ data: product }, { data: history }] = await Promise.all([
    client.from('products').select('*, product_images(id, url, position, alt, product_id)').eq('id', id).maybeSingle(),
    client.from('price_history').select('*').eq('product_id', id).order('created_at', { ascending: false }).limit(20),
  ]);
  return {
    product: (product as unknown as Product) ?? null,
    history: (history ?? []) as { id: number; old_price: number | null; new_price: number; created_at: string }[],
  };
}

export async function consoleCategories(): Promise<Category[]> {
  await requireConsole();
  const { data } = await serviceClient().from('categories').select('*').order('position');
  return (data ?? []) as Category[];
}

export async function consoleOrders(status = '', search = '', page = 1) {
  await requireConsole();
  const from = (page - 1) * PAGE;
  let query = serviceClient()
    .from('orders')
    .select('*, order_items(*), shipments(*), profiles(full_name, phone, email)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE - 1);
  if (status) query = query.eq('status', status);
  if (search) query = query.ilike('order_number', `%${search.replace(/[%,]/g, '')}%`);
  const { data, count } = await query;
  return { orders: (data ?? []) as unknown as Order[], total: count ?? 0, page };
}

export async function consoleOrder(id: string) {
  await requireConsole();
  const client = serviceClient();
  const [{ data: order }, { data: history }, { data: payments }, { data: couriers }] = await Promise.all([
    client
      .from('orders')
      .select('*, order_items(*), shipments(*), profiles(full_name, phone, email)')
      .eq('id', id)
      .maybeSingle(),
    client.from('order_status_history').select('*').eq('order_id', id).order('created_at'),
    client.from('payments').select('*').eq('order_id', id).order('created_at', { ascending: false }),
    client.from('user_roles').select('user_id, profiles(full_name, email)').eq('role', 'courier'),
  ]);

  return {
    order: (order as unknown as Order) ?? null,
    history: history ?? [],
    payments: payments ?? [],
    couriers: (couriers ?? []) as unknown as {
      user_id: string;
      profiles: { full_name: string | null; email: string | null } | null;
    }[],
  };
}

export async function consoleUsers(search = '', page = 1) {
  await requireConsole();
  const from = (page - 1) * PAGE;
  let query = serviceClient()
    .from('profiles')
    .select('id, email, full_name, phone, is_blocked, created_at, user_roles(role)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE - 1);
  // Commas, parentheses and `%` would change the parsed PostgREST filter.
  const term = search.replace(/[%,()]/g, ' ').trim();
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%,phone.ilike.%${term}%`);
  const { data, count } = await query;
  return { users: (data ?? []) as unknown as ProfileRow[], total: count ?? 0, page };
}

export async function consoleZones(): Promise<DeliveryZone[]> {
  await requireConsole();
  const { data } = await serviceClient().from('delivery_zones').select('*').order('position');
  return (data ?? []) as DeliveryZone[];
}

export async function consoleDeliveryBoard() {
  await requireConsole();
  const client = serviceClient();
  const [{ data: shipments }, { data: compensations }] = await Promise.all([
    client
      .from('shipments')
      .select('*, orders(order_number, status, promised_at, address_snapshot, total)')
      .in('status', ['pending', 'assigned', 'picked_up', 'in_transit'])
      .order('created_at', { ascending: false })
      .limit(50),
    client
      .from('delivery_compensations')
      .select('*, orders(order_number)')
      .order('created_at', { ascending: false })
      .limit(20),
  ]);
  return { shipments: shipments ?? [], compensations: compensations ?? [] };
}

export async function consolePayments(page = 1) {
  await requireConsole();
  const from = (page - 1) * PAGE;
  const client = serviceClient();
  const [{ data: payments, count }, { data: events }] = await Promise.all([
    client
      .from('payments')
      .select('*, orders(order_number)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + PAGE - 1),
    client.from('payment_events').select('*').order('created_at', { ascending: false }).limit(30),
  ]);
  return { payments: payments ?? [], total: count ?? 0, events: events ?? [], page };
}

export async function consoleTickets(status = '') {
  await requireConsole();
  let query = serviceClient()
    .from('tickets')
    .select('*, ticket_messages(*), profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  if (status) query = query.eq('status', status);
  const { data } = await query;
  return (data ?? []) as unknown as Ticket[];
}

export async function consoleReviews() {
  await requireConsole();
  const { data } = await serviceClient()
    .from('reviews')
    .select('*, products(name_uz, slug), profiles(full_name, email)')
    .order('created_at', { ascending: false })
    .limit(100);
  return data ?? [];
}

export async function consoleContent() {
  await requireConsole();
  const client = serviceClient();
  const [{ data: banners }, { data: news }] = await Promise.all([
    client.from('banners').select('*').order('position'),
    client.from('news').select('*').order('created_at', { ascending: false }).limit(50),
  ]);
  return {
    banners: (banners ?? []) as Banner[],
    news: (news ?? []) as {
      id: string;
      slug: string;
      title: string;
      body: string;
      is_published: boolean;
      published_at: string | null;
    }[],
  };
}

export async function consoleSettings() {
  await requireConsole();
  const { data } = await serviceClient().from('settings').select('*').order('key');
  return (data ?? []) as { key: string; value: unknown; updated_at: string }[];
}

export async function consoleSecurity() {
  await requireConsole();
  const client = serviceClient();
  const [{ data: allowlist }, { data: sessions }, { data: attempts }, { data: audits }, { data: ips }] =
    await Promise.all([
      client.from('admin_allowlist').select('email, note, created_at').order('created_at'),
      client
        .from('admin_sessions')
        .select('id, user_id, ip, user_agent, created_at, expires_at, revoked_at')
        .order('created_at', { ascending: false })
        .limit(20),
      client
        .from('login_attempts')
        .select('identifier, ip, scope, successful, created_at')
        .order('created_at', { ascending: false })
        .limit(30),
      client.from('audit_log').select('*').order('created_at', { ascending: false }).limit(50),
      client.from('admin_ip_allowlist').select('cidr, note').order('created_at'),
    ]);

  return {
    allowlist: (allowlist ?? []) as { email: string; note: string | null; created_at: string }[],
    sessions: (sessions ?? []) as {
      id: string;
      user_id: string;
      ip: string | null;
      user_agent: string | null;
      created_at: string;
      expires_at: string;
      revoked_at: string | null;
    }[],
    attempts: (attempts ?? []) as {
      identifier: string;
      ip: string | null;
      scope: string;
      successful: boolean;
      created_at: string;
    }[],
    audits: (audits ?? []) as AuditLogRow[],
    ips: (ips ?? []) as { cidr: string; note: string | null }[],
  };
}
