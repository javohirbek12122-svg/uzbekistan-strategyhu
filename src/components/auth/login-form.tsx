'use client';

import { useActionState } from 'react';
import { signIn } from '@/server/actions/auth';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, initialFormState);

  return (
    <form action={action} className="space-y-3">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label className="label" htmlFor="email">Email</label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Parol</label>
        <input id="password" name="password" type="password" autoComplete="current-password" className="input" required />
      </div>
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton className="w-full">Kirish</SubmitButton>
      <p className="text-xs text-ink-500">Yangi hisob ro&apos;yxatdan o&apos;tgandan keyin darhol faollashadi.</p>
    </form>
  );
}
