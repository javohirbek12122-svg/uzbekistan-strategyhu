'use client';

import { useActionState, useState } from 'react';
import { sendPhoneCode, signIn, verifyPhoneCode } from '@/server/actions/auth';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function LoginForm({ next }: { next?: string }) {
  const [phone, setPhone] = useState('');
  const [state, action] = useActionState(signIn, initialFormState);
  const [smsState, sendCode] = useActionState(sendPhoneCode, initialFormState);
  const [verifyState, verifyCode] = useActionState(verifyPhoneCode, initialFormState);

  return (
    <>
      <form action={action} className="space-y-3">
      {next && <input type="hidden" name="next" value={next} />}
      <div>
        <label className="label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" className="input" required />
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
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton className="w-full">Kirish</SubmitButton>
    </form>

      <div className="border-t border-slate-200 pt-4">
      <p className="mb-3 text-sm font-semibold">Telefon orqali kirish</p>
      <form action={sendCode} className="space-y-3">
        {next && <input type="hidden" name="next" value={next} />}
        <div>
          <label className="label" htmlFor="phone-login">
            Telefon raqam
          </label>
          <input
            id="phone-login"
            name="phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="+998901234567"
            className="input"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
          />
        </div>
        {smsState?.message && (
          <p className={`text-sm ${smsState.ok ? 'text-brand-700' : 'text-red-600'}`}>{smsState.message}</p>
        )}
        <SubmitButton className="w-full">SMS kod yuborish</SubmitButton>
      </form>

      {smsState?.ok && (
        <form action={verifyCode} className="mt-3 space-y-3">
          {next && <input type="hidden" name="next" value={next} />}
          <input type="hidden" name="phone" value={phone} />
          <div>
            <label className="label" htmlFor="sms-code">
              SMS kodi
            </label>
            <input
              id="sms-code"
              name="token"
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              placeholder="123456"
              className="input tracking-widest"
              required
            />
          </div>
          {verifyState?.message && <p className="text-sm text-red-600">{verifyState.message}</p>}
          <SubmitButton className="w-full">SMS kod bilan kirish</SubmitButton>
        </form>
      )}
      </div>
    </>
  );
}
