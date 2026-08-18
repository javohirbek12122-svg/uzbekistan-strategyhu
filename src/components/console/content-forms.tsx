'use client';

import { useActionState } from 'react';
import { publishNews, saveBanner } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function BannerForm() {
  const [state, action] = useActionState(saveBanner, initialFormState);

  return (
    <form action={action} className="space-y-3">
      <input name="title" className="input" placeholder="Sarlavha" required />
      <input name="subtitle" className="input" placeholder="Qo'shimcha matn" />
      <input name="image_url" className="input" placeholder="Rasm URL" />
      <input name="link" className="input" placeholder="Havola (masalan /catalog)" />
      <input name="position" type="number" className="input" placeholder="Tartib" defaultValue={0} />
      {state?.message && (
        <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>
      )}
      <SubmitButton>Banner qo&apos;shish</SubmitButton>
    </form>
  );
}

export function NewsForm() {
  const [state, action] = useActionState(publishNews, initialFormState);

  return (
    <form action={action} className="space-y-3">
      <input name="title" className="input" placeholder="E'lon sarlavhasi" required />
      <textarea name="body" rows={5} className="input" placeholder="E'lon matni" required />
      {state?.message && (
        <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>
      )}
      <SubmitButton>E&apos;lonni joylash</SubmitButton>
    </form>
  );
}
