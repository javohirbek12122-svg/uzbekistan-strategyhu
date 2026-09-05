import { requireServiceClient } from '@/lib/supabase/service';

export async function getAnalyticsOverview() {
  const client = requireServiceClient();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const monthAgo = new Date(today);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const [
    todayOrders,
    weekOrders,
    monthOrders,
    todayRevenue,
    weekRevenue,
    monthRevenue,
    totalUsers,
    activeToday,
    onlineNow,
    topProducts,
    recentEvents,
    pageViewsToday,
    deviceStats,
    browserStats,
    countryStats,
  ] = await Promise.all([
    client.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    client.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
    client.from('orders').select('id', { count: 'exact', head: true }).gte('created_at', monthAgo.toISOString()),
    client.from('orders').select('total').gte('created_at', today.toISOString()).eq('payment_status', 'paid'),
    client.from('orders').select('total').gte('created_at', weekAgo.toISOString()).eq('payment_status', 'paid'),
    client.from('orders').select('total').gte('created_at', monthAgo.toISOString()).eq('payment_status', 'paid'),
    client.from('profiles').select('id', { count: 'exact', head: true }),
    client.from('analytics_events').select('user_id', { count: 'exact', head: true }).gte('created_at', today.toISOString()).not('user_id', 'is', null),
    client.from('analytics_events').select('session_id', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()),
    client.from('order_items').select('product_id, quantity').order('quantity', { ascending: false }).limit(5),
    client.from('analytics_events').select('*').order('created_at', { ascending: false }).limit(20),
    client.from('page_views').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
    client.from('analytics_events').select('device_type').gte('created_at', weekAgo.toISOString()),
    client.from('analytics_events').select('browser').gte('created_at', weekAgo.toISOString()),
    client.from('analytics_events').select('country').gte('created_at', weekAgo.toISOString()).not('country', 'is', null),
  ]);

  const calcSum = (rows: { total?: string | number }[] | null | undefined) =>
    (rows ?? []).reduce((sum, row) => sum + Number(row.total ?? 0), 0);

  const calcCount = (count: number | null | undefined) => count ?? 0;

  const deviceMap = new Map<string, number>();
  for (const row of deviceStats?.data ?? []) {
    const key = (row as { device_type?: string | null }).device_type ?? 'unknown';
    deviceMap.set(key, (deviceMap.get(key) ?? 0) + 1);
  }

  const browserMap = new Map<string, number>();
  for (const row of browserStats?.data ?? []) {
    const key = (row as { browser?: string | null }).browser ?? 'unknown';
    browserMap.set(key, (browserMap.get(key) ?? 0) + 1);
  }

  const countryMap = new Map<string, number>();
  for (const row of countryStats?.data ?? []) {
    const key = (row as { country?: string | null }).country ?? 'unknown';
    countryMap.set(key, (countryMap.get(key) ?? 0) + 1);
  }

  return {
    today: {
      orders: calcCount(todayOrders.count),
      revenue: calcSum(todayRevenue.data),
    },
    week: {
      orders: calcCount(weekOrders.count),
      revenue: calcSum(weekRevenue.data),
    },
    month: {
      orders: calcCount(monthOrders.count),
      revenue: calcSum(monthRevenue.data),
    },
    users: {
      total: calcCount(totalUsers.count),
      activeToday: calcCount(activeToday.count),
      onlineNow: calcCount(onlineNow.count),
    },
    pageViews: {
      today: calcCount(pageViewsToday.count),
    },
    topProducts: (topProducts?.data ?? []).map((item) => ({
      product_id: item.product_id,
      quantity: item.quantity,
    })),
    recentEvents: (recentEvents?.data ?? []).slice(0, 20),
    devices: Array.from(deviceMap.entries()).map(([name, count]) => ({ name, count })),
    browsers: Array.from(browserMap.entries()).map(([name, count]) => ({ name, count })),
    countries: Array.from(countryMap.entries()).map(([name, count]) => ({ name, count })),
  };
}

export async function getRevenueChart(days = 14) {
  const client = requireServiceClient();
  const from = new Date();
  from.setDate(from.getDate() - days);
  from.setHours(0, 0, 0, 0);

  const { data } = await client
    .from('orders')
    .select('created_at, total')
    .gte('created_at', from.toISOString())
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: true });

  const map = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(from);
    d.setDate(d.getDate() + i);
    map.set(d.toISOString().slice(0, 10), 0);
  }

  (data ?? []).forEach((row) => {
    const day = new Date(row.created_at).toISOString().slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + Number(row.total));
  });

  return Array.from(map.entries()).map(([date, total]) => ({ date, total }));
}

export async function getOrdersByStatus() {
  const client = requireServiceClient();
  const { data } = await client
    .from('orders')
    .select('status')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const map = new Map<string, number>();
  (data ?? []).forEach((row) => {
    map.set(row.status, (map.get(row.status) ?? 0) + 1);
  });

  return Array.from(map.entries()).map(([status, count]) => ({ status, count }));
}
