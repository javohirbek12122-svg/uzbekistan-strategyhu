import Link from 'next/link';
import { notFound } from 'next/navigation';
import { consoleOrder } from '@/server/console/queries';
import { assignCourier } from '@/server/actions/console';
import { OrderStatusBadge, PaymentBadge, ShipmentBadge } from '@/components/ui/badges';
import { RefundControl, StatusControl } from '@/components/console/order-controls';
import { ORDER_STATUS_LABEL } from '@/lib/orders';
import { dateTime, money } from '@/lib/format';
import type { Shipment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ConsoleOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { order, history, payments, couriers } = await consoleOrder(id);
  if (!order) notFound();

  const shipment = (Array.isArray(order.shipments) ? order.shipments[0] : order.shipments) as Shipment | null;
  const snapshot = order.address_snapshot ?? {};
  const mapLink =
    snapshot.lat && snapshot.lng
      ? `https://www.google.com/maps/search/?api=1&query=${snapshot.lat},${snapshot.lng}`
      : null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Buyurtma #{order.order_number}</h1>
          <p className="text-sm text-ink-500">{dateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
          <Link href="/__console/orders" className="btn-secondary">
            Ro&apos;yxatga
          </Link>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="card overflow-x-auto">
            <h2 className="px-4 py-3 font-semibold">Tarkib</h2>
            <table className="table-base">
              <thead>
                <tr>
                  <th>Mahsulot</th>
                  <th>Narx</th>
                  <th>Soni</th>
                  <th>Jami</th>
                </tr>
              </thead>
              <tbody>
                {(order.order_items ?? []).map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.name_snapshot}
                      <span className="block text-xs text-ink-500">{item.sku_snapshot}</span>
                    </td>
                    <td>{money(item.unit_price)}</td>
                    <td>{item.quantity}</td>
                    <td className="font-medium">{money(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 font-semibold">Holat tarixi</h2>
            <ul className="space-y-2 text-sm">
              {history.map((row) => (
                <li key={row.id} className="flex items-start justify-between gap-3">
                  <span>
                    {ORDER_STATUS_LABEL[row.to_status as keyof typeof ORDER_STATUS_LABEL]}
                    {row.comment && <span className="block text-xs text-ink-500">{row.comment}</span>}
                  </span>
                  <span className="shrink-0 text-xs text-ink-500">{dateTime(row.created_at)}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="card p-4">
            <h2 className="mb-2 font-semibold">To&apos;lovlar</h2>
            <ul className="space-y-2 text-sm">
              {payments.map((payment) => (
                <li key={payment.id} className="flex flex-wrap items-center justify-between gap-2">
                  <span>
                    {payment.provider} · {money(Number(payment.amount))}
                    <span className="block text-xs text-ink-500">
                      {payment.provider_transaction_id ?? 'tranzaksiya yo\u2019q'}
                    </span>
                  </span>
                  <span className="text-xs text-ink-500">{payment.status}</span>
                </li>
              ))}
              {payments.length === 0 && <li className="text-ink-500">To&apos;lov yozuvi yo&apos;q.</li>}
            </ul>
          </section>
        </div>

        <aside className="space-y-4">
          <div className="card space-y-2 p-4 text-sm">
            <h2 className="font-semibold">Hisob</h2>
            <Row label="Mahsulotlar" value={money(order.items_total)} />
            <Row label="Yetkazib berish" value={money(order.delivery_fee)} />
            {order.discount_total > 0 && <Row label="Chegirma" value={`-${money(order.discount_total)}`} />}
            {order.compensation_total > 0 && <Row label="Qoplama" value={`-${money(order.compensation_total)}`} />}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 font-bold">
              <span>Jami</span>
              <span>{money(order.total)}</span>
            </div>
          </div>

          <div className="card space-y-1 p-4 text-sm">
            <h2 className="font-semibold">Xaridor va manzil</h2>
            <p>{order.profiles?.full_name ?? snapshot.recipient_name}</p>
            <p className="text-ink-500">{order.profiles?.email}</p>
            <p className="text-ink-500">{snapshot.phone}</p>
            <p className="text-ink-500">{snapshot.line1}</p>
            {snapshot.landmark && <p className="text-xs text-ink-500">{snapshot.landmark}</p>}
            {snapshot.zone && <p className="text-xs text-ink-500">Hudud: {snapshot.zone}</p>}
            <p className="pt-1 text-xs text-ink-500">Va&apos;da: {dateTime(order.promised_at)}</p>
            {mapLink && (
              <a href={mapLink} target="_blank" rel="noreferrer" className="text-sm text-brand-600 hover:underline">
                Xaritada ko&apos;rish
              </a>
            )}
          </div>

          <div className="card space-y-3 p-4">
            <h2 className="font-semibold">Holat</h2>
            <StatusControl orderId={order.id} status={order.status} />
          </div>

          <div className="card space-y-2 p-4">
            <h2 className="font-semibold">Kuryer</h2>
            {shipment && <ShipmentBadge status={shipment.status} />}
            <form action={assignCourier} className="space-y-2">
              <input type="hidden" name="order_id" value={order.id} />
              <select name="courier_id" className="input" defaultValue={shipment?.courier_id ?? ''}>
                <option value="">— tayinlanmagan —</option>
                {couriers.map((courier) => (
                  <option key={courier.user_id} value={courier.user_id}>
                    {courier.profiles?.full_name ?? courier.profiles?.email ?? courier.user_id}
                  </option>
                ))}
              </select>
              <button type="submit" className="btn-secondary w-full">
                Saqlash
              </button>
            </form>
          </div>

          {order.payment_status === 'paid' && (
            <div className="card space-y-2 p-4">
              <h2 className="font-semibold">Pul qaytarish</h2>
              <RefundControl orderId={order.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
