'use client';

import { useActionState } from 'react';
import { signIn, signInWithGoogle } from '@/server/actions/auth';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState(signIn, initialFormState);
  const [googleState, googleAction] = useActionState(signInWithGoogle, initialFormState);

  return (
    <>
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
      <div className="mt-3 space-y-3">
      {googleState?.message && <p className="text-sm text-red-600">{googleState.message}</p>}
      <div className="relative py-1 text-center text-xs text-ink-500">
        <span className="relative z-10 bg-white px-2">yoki</span>
        <span className="absolute inset-x-0 top-1/2 border-t border-slate-200" />
      </div>
      <form action={googleAction}>
        {next && <input type="hidden" name="next" value={next} />}
        <SubmitButton className="w-full border border-slate-300 bg-white text-slate-800 hover:bg-slate-50">
          Google bilan kirish
        </SubmitButton>
      </form>
      </div>
    </>
  );
}
