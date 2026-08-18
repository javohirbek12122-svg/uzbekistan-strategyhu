import Link from 'next/link';
import { consoleDeliveryBoard, consoleZones } from '@/server/console/queries';
import { runLateCompensations } from '@/server/actions/console';
import { ZoneForm } from '@/components/console/zone-form';
import { ShipmentBadge } from '@/components/ui/badges';
import { formatEta } from '@/lib/delivery';
import { dateTime, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ConsoleDeliveryPage() {
  const [zones, { shipments, compensations }] = await Promise.all([consoleZones(), consoleDeliveryBoard()]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Yetkazib berish</h1>
        <form action={runLateCompensations}>
          <button type="submit" className="btn-secondary">
            Kechikkanlarga qoplama hisoblash
          </button>
        </form>
      </div>

      <section className="card overflow-x-auto">
        <h2 className="px-4 py-3 font-semibold">Hududlar va tariflar</h2>
        <table className="table-base">
          <thead>
            <tr>
              <th>Hudud</th>
              <th>Narx</th>
              <th>1 kg</th>
              <th>Muddat</th>
              <th>SLA</th>
              <th>Holat</th>
            </tr>
          </thead>
          <tbody>
            {zones.map((zone) => (
              <tr key={zone.id}>
                <td className="font-medium">{zone.name_uz}</td>
                <td>
                  {money(zone.base_fee)} – {money(zone.max_fee)}
                </td>
                <td>{money(zone.fee_per_kg)}</td>
                <td>{formatEta(zone)}</td>
                <td>{zone.sla_hours} soat</td>
                <td>
                  <span className={`badge ${zone.is_active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-ink-500'}`}>
                    {zone.is_active ? 'Faol' : 'Yopilgan'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Hudud qo&apos;shish / tahrirlash</h2>
          <p className="mb-3 text-xs text-ink-500">
            Mavjud hududni tahrirlash uchun slug&apos;ni bir xil qoldiring — tarif yangilanadi.
          </p>
          <ZoneForm />
        </section>

        <section className="card p-4">
          <h2 className="mb-3 font-semibold">Yo&apos;ldagi yetkazishlar</h2>
          <ul className="space-y-2 text-sm">
            {shipments.map((shipment) => {
              const order = shipment.orders as { order_number?: string; promised_at?: string } | null;
              return (
                <li key={shipment.id} className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <span>
                    <Link href={`/__console/orders/${shipment.order_id}`} className="font-medium text-brand-700 hover:underline">
                      #{order?.order_number}
                    </Link>
                    <span className="block text-xs text-ink-500">Va&apos;da: {dateTime(order?.promised_at ?? null)}</span>
                  </span>
                  <ShipmentBadge status={shipment.status} />
                </li>
              );
            })}
            {shipments.length === 0 && <li className="text-ink-500">Yo&apos;ldagi buyurtma yo&apos;q.</li>}
          </ul>
        </section>
      </div>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Oxirgi kompensatsiyalar</h2>
        <ul className="space-y-1 text-sm">
          {compensations.map((row) => {
            const order = row.orders as { order_number?: string } | null;
            return (
              <li key={row.id} className="flex items-center justify-between gap-2">
                <span>
                  #{order?.order_number} · {money(Number(row.amount))}
                  <span className="block text-xs text-ink-500">{row.reason}</span>
                </span>
                <span className="text-xs text-ink-500">{dateTime(row.created_at)}</span>
              </li>
            );
          })}
          {compensations.length === 0 && <li className="text-ink-500">Hozircha kompensatsiya yo&apos;q.</li>}
        </ul>
      </section>
    </div>
  );
}
