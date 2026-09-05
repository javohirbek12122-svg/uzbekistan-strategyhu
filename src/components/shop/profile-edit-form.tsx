'use client';

import { useState, useRef } from 'react';
import { useActionState } from 'react';
import { updateProfile } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function ProfileEditForm({ defaultValues }: { defaultValues: { surname: string | null; first_name: string | null; patronymic: string | null; phone: string | null; avatar_url: string | null } }) {
  const [state, action] = useActionState(updateProfile, initialFormState);
  const [avatarUrl, setAvatarUrl] = useState(defaultValues.avatar_url ?? '');
  const [preview, setPreview] = useState(defaultValues.avatar_url ?? '');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (!data.ok) throw new Error(data.message);
      setAvatarUrl(data.url);
      setPreview(data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action={action} className="card space-y-4 p-6">
      <input type="hidden" name="avatar_url" value={avatarUrl} />
      <div>
        <label className="label" htmlFor="surname">Familiya</label>
        <input id="surname" name="surname" className="input" required defaultValue={defaultValues.surname ?? ''} />
      </div>
      <div>
        <label className="label" htmlFor="first_name">Ism</label>
        <input id="first_name" name="first_name" className="input" required defaultValue={defaultValues.first_name ?? ''} />
      </div>
      <div>
        <label className="label" htmlFor="patronymic">Otasining ismi</label>
        <input id="patronymic" name="patronymic" className="input" required defaultValue={defaultValues.patronymic ?? ''} />
      </div>
      <div>
        <label className="label" htmlFor="phone">Telefon</label>
        <input id="phone" name="phone" className="input" defaultValue={defaultValues.phone ?? ''} />
      </div>
      <div>
        <label className="label">Profil rasmi</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="input"
          onChange={onFileChange}
        />
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 h-24 w-24 rounded-full object-cover" />
        )}
        {uploading && <p className="mt-1 text-xs text-ink-500">Yuklanmoqda…</p>}
      </div>
      {state?.message && <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>}
      <SubmitButton className="w-full" pendingLabel="Saqlanmoqda…">Saqlash</SubmitButton>
    </form>
  );
}
