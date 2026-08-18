import Link from 'next/link';
import { consoleOrders } from '@/server/console/queries';
import { OrderStatusBadge, PaymentBadge } from '@/components/ui/badges';
import { ORDER_STATUS_LABEL } from '@/lib/orders';
import { cn, dateTime, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

const STATUSES = Object.keys(ORDER_STATUS_LABEL) as (keyof typeof ORDER_STATUS_LABEL)[];

export default async function ConsoleOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; page?: string }>;
}) {
  const { status = '', q = '', page } = await searchParams;
  const { orders, total } = await consoleOrders(status, q, Number(page ?? '1') || 1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Buyurtmalar ({total})</h1>
        <form action="/__console/orders" className="flex gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Buyurtma raqami" className="input w-48" />
          <button type="submit" className="btn-secondary">
            Qidirish
          </button>
        </form>
      </div>

      <div className="flex flex-wrap gap-1">
        <Link
          href="/__console/orders"
          className={cn('rounded-full border px-3 py-1 text-xs', !status ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white')}
        >
          Barchasi
        </Link>
        {STATUSES.map((key) => (
          <Link
            key={key}
            href={`/__console/orders?status=${key}`}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              status === key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white',
            )}
          >
            {ORDER_STATUS_LABEL[key]}
          </Link>
        ))}
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Raqam</th>
              <th>Xaridor</th>
              <th>Manzil</th>
              <th>Holat</th>
              <th>To&apos;lov</th>
              <th>Summa</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/__console/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">
                    #{order.order_number}
                  </Link>
                </td>
                <td>
                  {order.profiles?.full_name ?? '—'}
                  <span className="block text-xs text-ink-500">{order.address_snapshot?.phone}</span>
                </td>
                <td className="max-w-[220px] text-xs text-ink-500">{order.address_snapshot?.line1}</td>
                <td><OrderStatusBadge status={order.status} /></td>
                <td><PaymentBadge status={order.payment_status} /></td>
                <td className="font-medium">{money(order.total)}</td>
                <td className="text-xs text-ink-500">{dateTime(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-sm text-ink-500">Buyurtma topilmadi.</p>}
      </div>
    </div>
  );
}
