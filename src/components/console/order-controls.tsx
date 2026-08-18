'use client';

import { useActionState } from 'react';
import { refundOrder, updateOrderStatus } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { ORDER_STATUS_LABEL, ORDER_TRANSITIONS } from '@/lib/orders';
import { SubmitButton } from '@/components/ui/submit-button';
import type { OrderStatus } from '@/lib/types';

export function StatusControl({ orderId, status }: { orderId: string; status: OrderStatus }) {
  const [state, action] = useActionState(updateOrderStatus, initialFormState);
  const next = ORDER_TRANSITIONS[status];

  if (next.length === 0) {
    return <p className="text-sm text-ink-500">Bu holatdan keyingi o&apos;tish yo&apos;q.</p>;
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="order_id" value={orderId} />
      <div>
        <label className="label" htmlFor="status">
          Yangi holat
        </label>
        <select id="status" name="status" className="input" defaultValue={next[0]}>
          {next.map((option) => (
            <option key={option} value={option}>
              {ORDER_STATUS_LABEL[option]}
            </option>
          ))}
        </select>
      </div>
      <input name="comment" className="input" placeholder="Izoh (ixtiyoriy)" />
      {state?.message && (
        <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>
      )}
      <SubmitButton className="w-full">Holatni o&apos;zgartirish</SubmitButton>
    </form>
  );
}

export function RefundControl({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(refundOrder, initialFormState);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="order_id" value={orderId} />
      <input name="reason" className="input" placeholder="Qaytarish sababi" required />
      {state?.message && (
        <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>
      )}
      <SubmitButton className="btn-danger w-full">Pulni qaytarish</SubmitButton>
    </form>
  );
}
