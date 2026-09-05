import { ParentDashboard } from '@/components/admin/parent-dashboard';
import { getTodayOrders } from '@/server/queries';

export const dynamic = 'force-dynamic';

export default async function ParentDashboardPage() {
  const orders = await getTodayOrders();

  const formattedOrders = orders.map((order) => ({
    id: order.id,
    name: order.order_items?.[0]?.name_snapshot ?? 'Mahsulot',
    quantity: order.order_items?.reduce((sum, item) => sum + item.quantity, 0) ?? 0,
    weightKg: (order.order_items?.reduce((sum, item) => sum + item.weight_gram, 0) ?? 0) / 1000,
    destination: order.address_snapshot?.line1 ?? 'Noma\'lum',
    status: (order.payment_provider === 'p2p_telegram' ? 'labo' : 'damas') as 'damas' | 'labo' | 'vip' | 'pending',
  }));

  return <ParentDashboard orders={formattedOrders} />;
}
