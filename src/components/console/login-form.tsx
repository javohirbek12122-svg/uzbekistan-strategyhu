'use client';

import { useActionState } from 'react';
import { consoleLogin } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function ConsoleLoginForm() {
  const [state, action] = useActionState(consoleLogin, initialFormState);

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" className="input" required />
      </div>
      <div>
        <label className="label" htmlFor="password">
          Parol
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="input"
          required
        />
      </div>
      <div>
        <label className="label" htmlFor="token">
          Autentifikator kodi
        </label>
        <input
          id="token"
          name="token"
          inputMode="numeric"
          autoComplete="one-time-code"
          placeholder="123456"
          className="input tracking-widest"
          required
        />
        <p className="mt-1 text-xs text-ink-500">Kod ishlamasa, zaxira kodlardan birini kiriting.</p>
      </div>
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton className="w-full" pendingLabel="Tekshirilmoqda…">
        Kirish
      </SubmitButton>
    </form>
  );
}
