'use client';

import { useActionState } from 'react';
import { replyTicketAsStaff } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function StaffReply({ ticketId }: { ticketId: string }) {
  const [state, action] = useActionState(replyTicketAsStaff, initialFormState);

  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="ticket_id" value={ticketId} />
      <textarea name="body" rows={2} className="input" placeholder="Javob yozing…" required />
      {state?.message && (
        <p className={state.ok ? 'text-xs text-brand-600' : 'text-xs text-red-600'}>{state.message}</p>
      )}
      <SubmitButton className="py-1 text-xs">Javob yuborish</SubmitButton>
    </form>
  );
}
