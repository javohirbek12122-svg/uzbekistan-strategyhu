'use client';

import { useActionState } from 'react';
import { addAllowlistEmail, addIpAllowlist } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function AllowlistForm() {
  const [state, action] = useActionState(addAllowlistEmail, initialFormState);

  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input name="email" type="email" className="input flex-1" placeholder="email@example.com" required />
      <SubmitButton className="py-1 text-xs">Qo&apos;shish</SubmitButton>
      {state?.message && (
        <p className={`w-full text-xs ${state.ok ? 'text-brand-600' : 'text-red-600'}`}>{state.message}</p>
      )}
    </form>
  );
}

export function IpAllowlistForm() {
  const [state, action] = useActionState(addIpAllowlist, initialFormState);

  return (
    <form action={action} className="flex flex-wrap gap-2">
      <input name="cidr" className="input flex-1" placeholder="84.54.0.0/16 yoki 1.2.3.4" required />
      <input name="note" className="input w-32" placeholder="izoh" />
      <SubmitButton className="py-1 text-xs">Qo&apos;shish</SubmitButton>
      {state?.message && (
        <p className={`w-full text-xs ${state.ok ? 'text-brand-600' : 'text-red-600'}`}>{state.message}</p>
      )}
    </form>
  );
}
