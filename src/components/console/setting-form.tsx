'use client';

import { useActionState } from 'react';
import { saveSetting } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

/** Settings are JSON documents; the value textarea must contain valid JSON. */
export function SettingForm({ settingKey, value }: { settingKey?: string; value?: unknown }) {
  const [state, action] = useActionState(saveSetting, initialFormState);

  return (
    <form action={action} className="space-y-2">
      {settingKey ? (
        <input type="hidden" name="key" value={settingKey} />
      ) : (
        <input name="key" className="input" placeholder="sozlama kaliti (masalan store)" required />
      )}
      <textarea
        name="value"
        rows={settingKey ? 6 : 4}
        className="input font-mono text-xs"
        defaultValue={value === undefined ? '' : JSON.stringify(value, null, 2)}
        required
      />
      {state?.message && (
        <p className={state.ok ? 'text-xs text-brand-600' : 'text-xs text-red-600'}>{state.message}</p>
      )}
      <SubmitButton className="py-1 text-xs">Saqlash</SubmitButton>
    </form>
  );
}
