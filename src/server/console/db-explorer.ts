import 'server-only';
import { requireServiceClient } from '@/lib/supabase/service';
import { requireConsole } from '@/lib/security/console';

/**
 * Read-only database browser for the console. Only these tables can be listed,
 * and only through PostgREST — no raw SQL is ever accepted from the UI, so the
 * explorer cannot be turned into an injection vector.
 */
export const BROWSABLE_TABLES = {
  products: { label: 'Mahsulotlar', order: 'created_at', search: 'name_uz' },
  categories: { label: 'Kategoriyalar', order: 'position', search: 'name_uz' },
  orders: { label: 'Buyurtmalar', order: 'created_at', search: 'order_number' },
  order_items: { label: 'Buyurtma tarkibi', order: 'id', search: 'name_snapshot' },
  order_status_history: { label: 'Holat tarixi', order: 'created_at', search: null },
  payments: { label: "To'lovlar", order: 'created_at', search: 'provider_transaction_id' },
  payment_events: { label: "To'lov loglari", order: 'created_at', search: 'method' },
  refunds: { label: 'Qaytarishlar', order: 'created_at', search: null },
  shipments: { label: 'Yetkazishlar', order: 'created_at', search: null },
  delivery_zones: { label: 'Hududlar', order: 'position', search: 'name_uz' },
  delivery_compensations: { label: 'Kompensatsiyalar', order: 'created_at', search: null },
  addresses: { label: 'Manzillar', order: 'created_at', search: 'line1' },
  carts: { label: 'Savatlar', order: 'created_at', search: null },
  cart_items: { label: 'Savat tarkibi', order: 'created_at', search: null },
  profiles: { label: 'Foydalanuvchilar', order: 'created_at', search: 'email' },
  user_roles: { label: 'Rollar', order: 'granted_at', search: null },
  reviews: { label: 'Sharhlar', order: 'created_at', search: 'body' },
  tickets: { label: 'Murojaatlar', order: 'created_at', search: 'subject' },
  ticket_messages: { label: 'Murojaat xabarlari', order: 'created_at', search: 'body' },
  notifications: { label: 'Bildirishnomalar', order: 'created_at', search: 'title' },
  promo_codes: { label: 'Promo-kodlar', order: 'created_at', search: 'code' },
  price_history: { label: 'Narx tarixi', order: 'created_at', search: null },
  banners: { label: 'Bannerlar', order: 'position', search: 'title' },
  news: { label: "E'lonlar", order: 'created_at', search: 'title' },
  settings: { label: 'Sozlamalar', order: 'key', search: 'key' },
  audit_log: { label: 'Audit jurnali', order: 'created_at', search: 'action' },
  login_attempts: { label: 'Kirish urinishlari', order: 'created_at', search: 'identifier' },
  admin_allowlist: { label: 'Admin allow-list', order: 'created_at', search: 'email' },
  admin_sessions: { label: 'Admin sessiyalari', order: 'created_at', search: null },
} as const;

export type BrowsableTable = keyof typeof BROWSABLE_TABLES;

export function isBrowsableTable(value: string): value is BrowsableTable {
  return Object.prototype.hasOwnProperty.call(BROWSABLE_TABLES, value);
}

const PAGE_SIZE = 25;

/** Columns that must never be rendered, even to an admin. */
const REDACTED_COLUMNS = ['secret_encrypted', 'token_hash', 'recovery_codes_hashed'];

export interface TablePage {
  table: BrowsableTable;
  rows: Record<string, unknown>[];
  columns: string[];
  total: number;
  page: number;
  pageSize: number;
}

export async function readTable(table: BrowsableTable, page = 1, search = ''): Promise<TablePage> {
  await requireConsole();
  const meta = BROWSABLE_TABLES[table];
  const from = (page - 1) * PAGE_SIZE;

  let query = requireServiceClient()
    .from(table)
    .select('*', { count: 'exact' })
    .order(meta.order, { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  if (search && meta.search) {
    query = query.ilike(meta.search, `%${search.replace(/[%,]/g, '')}%`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(error.message);

  const rows = (data ?? []).map((row) => {
    const copy: Record<string, unknown> = { ...row };
    for (const column of REDACTED_COLUMNS) {
      if (column in copy) copy[column] = '•••';
    }
    return copy;
  });

  return {
    table,
    rows,
    columns: rows[0] ? Object.keys(rows[0]) : [],
    total: count ?? 0,
    page,
    pageSize: PAGE_SIZE,
  };
}

export interface DashboardStats {
  revenue: number;
  ordersToday: number;
  ordersTotal: number;
  pendingOrders: number
  lateOrders: number;
  openTickets: number;
  lowStock: number;
  customers: number;
  averageOrder: number;
}

export async function dashboardStats(): Promise<DashboardStats> {
  await requireConsole();
  const client = requireServiceClient();
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [paid, today, total, pending, late, tickets, lowStock, customers] = await Promise.all([
    client.from('orders').select('total').in('status', ['paid', 'confirmed', 'packing', 'shipped', 'delivered', 'completed']),
    client.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', startOfDay.toISOString()),
    client.from('orders').select('id', { count: 'exact', head: true }),
    client.from('orders').select('id', { count: 'exact', head: true }).in('status', ['created', 'pending_payment', 'paid', 'confirmed', 'packing']),
    client
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .lt('promised_at', new Date().toISOString())
      .in('status', ['confirmed', 'packing', 'shipped']),
    client.from('tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
    client.from('products').select('id', { count: 'exact', head: true }).lt('stock', 5).eq('is_active', true),
    client.from('profiles').select('id', { count: 'exact', head: true }),
  ]);

  const revenue = (paid.data ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const paidCount = (paid.data ?? []).length;

  return {
    revenue,
    ordersToday: today.count ?? 0,
    ordersTotal: total.count ?? 0,
    pendingOrders: pending.count ?? 0,
    lateOrders: late.count ?? 0,
    openTickets: tickets.count ?? 0,
    lowStock: lowStock.count ?? 0,
    customers: customers.count ?? 0,
    averageOrder: paidCount ? Math.round(revenue / paidCount) : 0,
  };
}
