import Link from 'next/link';
import { consoleTickets } from '@/server/console/queries';
import { setTicketStatus } from '@/server/actions/console';
import { StaffReply } from '@/components/console/ticket-reply';
import { TicketBadge } from '@/components/ui/badges';
import { cn, dateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

const KIND_LABEL: Record<string, string> = {
  complaint: 'Shikoyat',
  suggestion: 'Taklif',
  question: 'Savol',
  return_request: 'Qaytarish',
};

const STATUSES = ['open', 'in_progress', 'resolved', 'closed'] as const;
const STATUS_LABEL: Record<string, string> = {
  open: 'Ochiq',
  in_progress: 'Jarayonda',
  resolved: 'Hal qilindi',
  closed: 'Yopilgan',
};

export default async function ConsoleTicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = '' } = await searchParams;
  const tickets = await consoleTickets(status);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Murojaatlar ({tickets.length})</h1>

      <div className="flex flex-wrap gap-1">
        <Link
          href="/__console/tickets"
          className={cn('rounded-full border px-3 py-1 text-xs', !status ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white')}
        >
          Barchasi
        </Link>
        {STATUSES.map((key) => (
          <Link
            key={key}
            href={`/__console/tickets?status=${key}`}
            className={cn(
              'rounded-full border px-3 py-1 text-xs',
              status === key ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 bg-white',
            )}
          >
            {STATUS_LABEL[key]}
          </Link>
        ))}
      </div>

      <div className="space-y-3">
        {tickets.map((ticket) => (
          <article key={ticket.id} className="card p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="font-semibold">{ticket.subject}</h2>
                <p className="text-xs text-ink-500">
                  {KIND_LABEL[ticket.kind] ?? ticket.kind} · {ticket.profiles?.full_name ?? ticket.profiles?.email ?? '—'} ·{' '}
                  {dateTime(ticket.created_at)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <TicketBadge status={ticket.status} />
                <form action={setTicketStatus} className="flex items-center gap-1">
                  <input type="hidden" name="ticket_id" value={ticket.id} />
                  <select name="status" className="input py-1 text-xs" defaultValue={ticket.status}>
                    {STATUSES.map((key) => (
                      <option key={key} value={key}>
                        {STATUS_LABEL[key]}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="btn-secondary py-1 text-xs">
                    Saqlash
                  </button>
                </form>
              </div>
            </div>

            <ul className="mt-3 space-y-2">
              {(ticket.ticket_messages ?? []).map((message) => (
                <li
                  key={message.id}
                  className={cn(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    message.is_staff ? 'ml-auto bg-brand-50' : 'bg-slate-50',
                  )}
                >
                  <p className="whitespace-pre-line">{message.body}</p>
                  <p className="mt-1 text-[11px] text-ink-500">
                    {message.is_staff ? 'Do\u2019kon' : 'Xaridor'} · {dateTime(message.created_at)}
                  </p>
                </li>
              ))}
            </ul>

            {ticket.status !== 'closed' && <StaffReply ticketId={ticket.id} />}
          </article>
        ))}
        {tickets.length === 0 && <p className="card p-6 text-center text-sm text-ink-500">Murojaat yo&apos;q.</p>}
      </div>
    </div>
  );
}
