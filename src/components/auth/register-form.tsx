'use client';

import { useActionState } from 'react';
import { signUp } from '@/server/actions/auth';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function RegisterForm() {
  const [state, action] = useActionState(signUp, initialFormState);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-3">
      <Field label="To'liq ism" name="full_name" errors={errors.full_name} required />
      <Field label="Email" name="email" type="email" autoComplete="email" errors={errors.email} required />
      <Field label="Telefon" name="phone" placeholder="+998901234567" errors={errors.phone} required />
      <Field
        label="Parol"
        name="password"
        type="password"
        autoComplete="new-password"
        errors={errors.password}
        required
      />
      <p className="text-xs text-ink-500">
        Parol kamida 8 belgidan iborat bo&apos;lishi kerak.
      </p>
      {state?.message && <p className="text-sm text-red-600">{state.message}</p>}
      <SubmitButton className="w-full">Ro&apos;yxatdan o&apos;tish</SubmitButton>
    </form>
  );
}

function Field({
  label,
  name,
  errors,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; errors?: string[] }) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input id={name} name={name} className="input" {...props} />
      {errors && <p className="mt-1 text-xs text-red-600">{errors[0]}</p>}
    </div>
  );
}
