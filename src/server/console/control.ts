import 'server-only';

import { requireServiceClient } from '@/lib/supabase/service';
import { requireConsole } from '@/lib/security/console';

const PAID_ORDER_STATUSES = ['paid', 'confirmed', 'packing', 'shipped', 'delivered', 'completed'];

export interface ControlSnapshot {
  ordersToday: number;
  ordersTotal: number;
  revenue30d: number;
  paidOrders30d: number;
  avgOrder30d: number;
  activeProducts: number;
  lowStock: number;
  outOfStock: number;
  customers: number;
  openTickets: number;
  pendingReviews: number;
  activePromos: number;
  activeBanners: number;
  publishedNews: number;
  lateShipments: number;
  unassignedShipments: number;
  failedPayments24h: number;
  activeConsoleSessions: number;
  unreadAdminNotifications: number;
  latestAudits: Array<{
    id: number;
    action: string;
    actor_email: string | null;
    entity: string | null;
    created_at: string;
  }>;
  topProducts: Array<{
    id: string;
    name_uz: string;
    sold_count: number;
    stock: number;
    price: number;
  }>;
  ai: {
    mode: 'observe' | 'suggest' | 'assist';
    auto_monitoring: boolean;
    auto_notifications: boolean;
    require_approval_for_mutations: boolean;
    daily_digest: boolean;
  };
}

function asBool(value: unknown, fallback: boolean) {
  return typeof value === 'boolean' ? value : fallback;
}

function asMode(value: unknown): ControlSnapshot['ai']['mode'] {
  return value === 'observe' || value === 'assist' || value === 'suggest' ? value : 'suggest';
}

export async function controlSnapshot(): Promise<ControlSnapshot> {
  await requireConsole();
  const client = requireServiceClient();
  const since30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const since24 = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    ordersToday,
    ordersTotal,
    paid30,
    activeProducts,
    lowStock,
    outOfStock,
    customers,
    openTickets,
    pendingReviews,
    activePromos,
    activeBanners,
    publishedNews,
    lateShipments,
    unassignedShipments,
    failedPayments,
    activeSessions,
    adminNotifications,
    audits,
    topProducts,
    aiSetting,
  ] = await Promise.all([
    client.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
    client.from('orders').select('id', { count: 'exact', head: true }),
    client.from('orders').select('total').gte('created_at', since30).in('status', PAID_ORDER_STATUSES),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).gt('stock', 0).lt('stock', 5),
    client.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('stock', 0),
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    client.from('reviews').select('id', { count: 'exact', head: true }).eq('is_approved', false),
    client.from('promo_codes').select('id', { count: 'exact', head: true }).eq('is_active', true).or('ends_at.is.null,ends_at.gte.' + now),
    client.from('banners').select('id', { count: 'exact', head: true }).eq('is_active', true),
    client.from('news').select('id', { count: 'exact', head: true }).eq('is_published', true),
    client.from('shipments').select('id', { count: 'exact', head: true }).in('status', ['pending', 'assigned', 'picked_up', 'in_transit']).lt('planned_at', now),
    client.from('shipments').select('id', { count: 'exact', head: true }).eq('status', 'pending').is('courier_id', null),
    client.from('payments').select('id', { count: 'exact', head: true }).eq('status', 'failed').gte('created_at', since24),
    client.from('admin_sessions').select('id', { count: 'exact', head: true }).is('revoked_at', null).gt('expires_at', now),
    client.from('notifications').select('id', { count: 'exact', head: true }).eq('is_admin_only', true).is('read_at', null),
    client.from('audit_log').select('id, action, actor_email, entity, created_at').order('created_at', { ascending: false }).limit(12),
    client.from('products').select('id, name_uz, sold_count, stock, price').eq('is_active', true).order('sold_count', { ascending: false }).limit(8),
    client.from('settings').select('value').eq('key', 'ai_control').maybeSingle(),
  ]);

  const revenue30d = (paid30.data ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const paidOrders30d = (paid30.data ?? []).length;
  const rawAi = (aiSetting.data?.value ?? {}) as Record<string, unknown>;

  return {
    ordersToday: ordersToday.count ?? 0,
    ordersTotal: ordersTotal.count ?? 0,
    revenue30d,
    paidOrders30d,
    avgOrder30d: paidOrders30d ? Math.round(revenue30d / paidOrders30d) : 0,
    activeProducts: activeProducts.count ?? 0,
    lowStock: lowStock.count ?? 0,
    outOfStock: outOfStock.count ?? 0,
    customers: customers.count ?? 0,
    openTickets: openTickets.count ?? 0,
    pendingReviews: pendingReviews.count ?? 0,
    activePromos: activePromos.count ?? 0,
    activeBanners: activeBanners.count ?? 0,
    publishedNews: publishedNews.count ?? 0,
    lateShipments: lateShipments.count ?? 0,
    unassignedShipments: unassignedShipments.count ?? 0,
    failedPayments24h: failedPayments.count ?? 0,
    activeConsoleSessions: activeSessions.count ?? 0,
    unreadAdminNotifications: adminNotifications.count ?? 0,
    latestAudits: (audits.data ?? []) as ControlSnapshot['latestAudits'],
    topProducts: (topProducts.data ?? []) as ControlSnapshot['topProducts'],
    ai: {
      mode: asMode(rawAi.mode),
      auto_monitoring: asBool(rawAi.auto_monitoring, true),
      auto_notifications: asBool(rawAi.auto_notifications, true),
      require_approval_for_mutations: asBool(rawAi.require_approval_for_mutations, true),
      daily_digest: asBool(rawAi.daily_digest, true),
    },
  };
}
