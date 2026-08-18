import Link from 'next/link';
import type { Metadata } from 'next';
import { getMyOrders } from '@/server/queries';
import { OrderStatusBadge, PaymentBadge } from '@/components/ui/badges';
import { dateTime, money } from '@/lib/format';

export const metadata: Metadata = { title: 'Buyurtmalarim' };
export const dynamic = 'force-dynamic';

export default async function OrdersPage() {
  const orders = await getMyOrders();

  if (orders.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-bold">Buyurtmalar yo&apos;q</h1>
        <Link href="/catalog" className="btn-primary mt-4">
          Xarid qilish
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Buyurtmalarim</h1>
      <ul className="space-y-3">
        {orders.map((order) => (
          <li key={order.id} className="card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Link href={`/orders/${order.id}`} className="font-semibold hover:text-brand-600">
                  #{order.order_number}
                </Link>
                <p className="text-xs text-ink-500">{dateTime(order.created_at)}</p>
              </div>
              <div className="flex items-center gap-2">
                <OrderStatusBadge status={order.status} />
                <PaymentBadge status={order.payment_status} />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-ink-500">{order.order_items?.length ?? 0} ta mahsulot</span>
              <span className="font-bold">{money(order.total)}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
