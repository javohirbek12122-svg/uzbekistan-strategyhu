'use client';

import { useActionState } from 'react';
import { replyTicket } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';
import { cn, dateTime } from '@/lib/format';
import type { Ticket } from '@/lib/types';

export function TicketThread({ ticket }: { ticket: Ticket }) {
  const [state, action] = useActionState(replyTicket, initialFormState);
  const messages = [...(ticket.ticket_messages ?? [])].sort((a, b) => a.created_at.localeCompare(b.created_at));
  const closed = ticket.status === 'closed';

  return (
    <div className="mt-3 space-y-3">
      <ul className="space-y-2">
        {messages.map((message) => (
          <li
            key={message.id}
            className={cn(
              'max-w-[85%] rounded-lg px-3 py-2 text-sm',
              message.is_staff ? 'bg-brand-50 text-brand-900' : 'ml-auto bg-slate-100',
            )}
          >
            <p className="whitespace-pre-line">{message.body}</p>
            <p className="mt-1 text-[11px] text-ink-500">
              {message.is_staff ? 'Operator' : 'Siz'} · {dateTime(message.created_at)}
            </p>
          </li>
        ))}
      </ul>

      {!closed && (
        <form action={action} className="flex items-end gap-2">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <textarea name="body" rows={2} className="input" placeholder="Javob yozish…" />
          <SubmitButton>Yuborish</SubmitButton>
        </form>
      )}
      {state?.ok === false && state.message && <p className="text-xs text-red-600">{state.message}</p>}
    </div>
  );
}
