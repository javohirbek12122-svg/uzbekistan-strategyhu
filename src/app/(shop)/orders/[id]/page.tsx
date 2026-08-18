import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { getOrder, getOrderHistory } from '@/server/queries';
import { OrderStatusBadge, PaymentBadge, ShipmentBadge } from '@/components/ui/badges';
import { OrderTimeline } from '@/components/shop/order-timeline';
import { PayButton } from '@/components/shop/pay-button';
import { dateTime, money } from '@/lib/format';
import { evaluateSla } from '@/lib/orders';
import type { OrderStatusHistoryRow, Shipment } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function OrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { id } = await params;
  const { created } = await searchParams;
  const order = await getOrder(id);
  if (!order) notFound();

  const history = (await getOrderHistory(id)) as OrderStatusHistoryRow[];
  const shipment = (Array.isArray(order.shipments) ? order.shipments[0] : order.shipments) as Shipment | null;
  const sla = evaluateSla({ promisedAt: order.promised_at, deliveredAt: order.delivered_at });
  const unpaid = order.payment_status !== 'paid' && order.payment_provider !== 'cash' && order.status !== 'cancelled';

  return (
    <div className="space-y-5">
      {created && (
        <div className="card flex items-center gap-2 border-brand-300 bg-brand-50 p-3 text-sm text-brand-800">
          <CheckCircle2 className="h-5 w-5" />
          Buyurtmangiz qabul qilindi. Operator tez orada bog&apos;lanadi.
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Buyurtma #{order.order_number}</h1>
          <p className="text-sm text-ink-500">{dateTime(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <OrderStatusBadge status={order.status} />
          <PaymentBadge status={order.payment_status} />
        </div>
      </div>

      {sla.isLate && (
        <div className="card flex items-start gap-2 border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-5 w-5" />
          <span>
            Yetkazib berish {sla.hoursLate} soatga kechikdi. Sizga {money(sla.compensation)} qoplama hisoblanadi.
          </span>
        </div>
      )}

      <section className="card p-4">
        <h2 className="mb-3 font-semibold">Holat</h2>
        <OrderTimeline status={order.status} history={history} />
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Mahsulotlar</h2>
          <ul className="divide-y divide-slate-100">
            {(order.order_items ?? []).map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3 py-2 text-sm">
                <span>
                  {item.name_snapshot}
                  <span className="block text-xs text-ink-500">
                    {money(item.unit_price)} × {item.quantity}
                  </span>
                </span>
                <span className="font-medium">{money(item.line_total)}</span>
              </li>
            ))}
          </ul>
        </section>

        <aside className="space-y-4">
          <div className="card space-y-2 p-4 text-sm">
            <h2 className="font-semibold">Hisob</h2>
            <Row label="Mahsulotlar" value={money(order.items_total)} />
            <Row label="Yetkazib berish" value={money(order.delivery_fee)} />
            {order.discount_total > 0 && <Row label="Chegirma" value={`-${money(order.discount_total)}`} />}
            {order.compensation_total > 0 && (
              <Row label="Kechikish qoplamasi" value={`-${money(order.compensation_total)}`} />
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-base font-bold">
              <span>Jami</span>
              <span>{money(order.total)}</span>
            </div>
            {unpaid && <PayButton orderId={order.id} label="To'lovni amalga oshirish" />}
          </div>

          <div className="card space-y-1 p-4 text-sm">
            <h2 className="font-semibold">Yetkazib berish</h2>
            <p>{order.address_snapshot?.recipient_name}</p>
            <p className="text-ink-500">{order.address_snapshot?.line1}</p>
            <p className="text-ink-500">{order.address_snapshot?.phone}</p>
            {order.address_snapshot?.zone && <p className="text-xs text-ink-500">{order.address_snapshot.zone}</p>}
            <p className="pt-2 text-xs text-ink-500">Va&apos;da qilingan vaqt: {dateTime(order.promised_at)}</p>
            {shipment && (
              <p className="pt-1">
                <ShipmentBadge status={shipment.status} />
              </p>
            )}
          </div>

          <Link href={`/support?order=${order.id}`} className="btn-secondary w-full">
            Shu buyurtma bo&apos;yicha murojaat
          </Link>
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
