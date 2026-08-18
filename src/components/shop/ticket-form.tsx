'use client';

import { useActionState } from 'react';
import { createTicket } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

const KINDS = [
  { key: 'question', label: 'Savol' },
  { key: 'complaint', label: 'Shikoyat' },
  { key: 'suggestion', label: 'Taklif' },
  { key: 'return_request', label: "Qaytarish so'rovi" },
] as const;

export function TicketForm({ orderId }: { orderId?: string }) {
  const [state, action] = useActionState(createTicket, initialFormState);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="font-semibold">Yangi murojaat</h2>
      {orderId && <input type="hidden" name="order_id" value={orderId} />}

      <div>
        <label className="label" htmlFor="kind">
          Turi
        </label>
        <select id="kind" name="kind" className="input" defaultValue="question">
          {KINDS.map((kind) => (
            <option key={kind.key} value={kind.key}>
              {kind.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="subject">
          Mavzu
        </label>
        <input id="subject" name="subject" className="input" />
        {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject[0]}</p>}
      </div>

      <div>
        <label className="label" htmlFor="body">
          Matn
        </label>
        <textarea id="body" name="body" rows={5} className="input" />
        {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body[0]}</p>}
      </div>

      {state?.message && (
        <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>
      )}
      <SubmitButton className="w-full">Yuborish</SubmitButton>
    </form>
  );
}
