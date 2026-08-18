import type { Metadata } from 'next';
import { getMyTickets, getStoreSettings } from '@/server/queries';
import { TicketForm } from '@/components/shop/ticket-form';
import { TicketBadge } from '@/components/ui/badges';
import { dateTime } from '@/lib/format';
import { TicketThread } from '@/components/shop/ticket-thread';

export const metadata: Metadata = { title: 'Yordam va murojaatlar' };
export const dynamic = 'force-dynamic';

export default async function SupportPage({ searchParams }: { searchParams: Promise<{ order?: string }> }) {
  const { order } = await searchParams;
  const [tickets, settings] = await Promise.all([getMyTickets(), getStoreSettings()]);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <div>
          <h1 className="text-xl font-bold">Yordam markazi</h1>
          <p className="text-sm text-ink-500">
            Savol, shikoyat yoki taklifingizni yozing — operator javob beradi. Telefon: {settings.phone}
          </p>
        </div>

        {tickets.length === 0 ? (
          <p className="card p-6 text-sm text-ink-500">Murojaatlaringiz hozircha yo&apos;q.</p>
        ) : (
          <ul className="space-y-3">
            {tickets.map((ticket) => (
              <li key={ticket.id} className="card p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold">{ticket.subject}</p>
                  <div className="flex items-center gap-2">
                    <TicketBadge status={ticket.status} />
                    <span className="text-xs text-ink-500">{dateTime(ticket.created_at)}</span>
                  </div>
                </div>
                <TicketThread ticket={ticket} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <aside>
        <TicketForm orderId={order} />
      </aside>
    </div>
  );
}
