import Link from 'next/link';
import { consolePayments } from '@/server/console/queries';
import { dateTime, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ConsolePaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const current = Number(page ?? '1') || 1;
  const { payments, total, events } = await consolePayments(current);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold">To&apos;lovlar ({total})</h1>

      <section className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Buyurtma</th>
              <th>Provayder</th>
              <th>Summa</th>
              <th>Holat</th>
              <th>Tranzaksiya</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => {
              const order = payment.orders as { order_number?: string } | null;
              return (
                <tr key={payment.id}>
                  <td>
                    <Link href={`/__console/orders/${payment.order_id}`} className="font-medium text-brand-700 hover:underline">
                      #{order?.order_number}
                    </Link>
                  </td>
                  <td className="uppercase">{payment.provider}</td>
                  <td className="font-medium">{money(Number(payment.amount))}</td>
                  <td>{payment.status}</td>
                  <td className="max-w-[180px] truncate text-xs text-ink-500">
                    {payment.provider_transaction_id ?? '—'}
                  </td>
                  <td className="text-xs text-ink-500">{dateTime(payment.created_at)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {payments.length === 0 && <p className="p-6 text-center text-sm text-ink-500">To&apos;lov yozuvi yo&apos;q.</p>}
      </section>

      <section className="card p-4">
        <h2 className="mb-2 font-semibold">Provayder loglari (oxirgi 30)</h2>
        <p className="mb-3 text-xs text-ink-500">
          Payme/Click callback&apos;lari. Imzo tekshiruvi va summa mosligi shu yerda ko&apos;rinadi.
        </p>
        <ul className="space-y-2 text-sm">
          {events.map((event) => (
            <li key={event.id} className="border-b border-slate-100 pb-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium uppercase">
                  {String(event.provider)} · {String(event.method)}
                </span>
                <span className="flex items-center gap-2 text-xs">
                  <span className={event.signature_valid ? 'text-brand-600' : 'text-red-600'}>
                    {event.signature_valid ? 'imzo OK' : 'imzo xato'}
                  </span>
                  <span className="text-ink-500">{dateTime(event.created_at)}</span>
                </span>
              </div>
              <pre className="mt-1 max-h-24 overflow-auto rounded bg-slate-50 p-2 text-[11px] leading-tight">
                {JSON.stringify(event.request, null, 1)}
              </pre>
            </li>
          ))}
          {events.length === 0 && <li className="text-ink-500">Log yo&apos;q.</li>}
        </ul>
      </section>

      <div className="flex justify-between">
        {current > 1 ? (
          <Link href={`/__console/payments?page=${current - 1}`} className="btn-secondary">
            Oldingi
          </Link>
        ) : (
          <span />
        )}
        {current * 30 < total && (
          <Link href={`/__console/payments?page=${current + 1}`} className="btn-secondary">
            Keyingi
          </Link>
        )}
      </div>
    </div>
  );
}
