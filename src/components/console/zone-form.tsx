'use client';

import { useActionState } from 'react';
import { saveZone } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';
import type { DeliveryZone } from '@/lib/types';

export function ZoneForm({ zone }: { zone?: DeliveryZone | null }) {
  const [state, action] = useActionState(saveZone, initialFormState);

  return (
    <form action={action} className="grid gap-3 sm:grid-cols-2">
      {zone && <input type="hidden" name="id" value={zone.id} />}
      <Input label="Hudud nomi" name="name_uz" defaultValue={zone?.name_uz} required />
      <Input label="Slug" name="slug" defaultValue={zone?.slug} required />
      <Input label="Bazaviy narx" name="base_fee" type="number" defaultValue={zone?.base_fee ?? 15000} required />
      <Input label="Maksimal narx" name="max_fee" type="number" defaultValue={zone?.max_fee ?? 35000} required />
      <Input label="1 kg uchun" name="fee_per_kg" type="number" defaultValue={zone?.fee_per_kg ?? 0} required />
      <Input label="Min soat" name="min_hours" type="number" defaultValue={zone?.min_hours ?? 1} required />
      <Input label="Maks soat" name="max_hours" type="number" defaultValue={zone?.max_hours ?? 24} required />
      <Input label="SLA (soat)" name="sla_hours" type="number" defaultValue={zone?.sla_hours ?? 24} required />
      <Input label="Markaz lat" name="center_lat" defaultValue={zone?.center_lat ?? ''} />
      <Input label="Markaz lng" name="center_lng" defaultValue={zone?.center_lng ?? ''} />
      <Input label="Radius (km)" name="radius_km" defaultValue={zone?.radius_km ?? ''} />
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_active" defaultChecked={zone?.is_active ?? true} /> Faol
      </label>
      {state?.message && (
        <p className={`sm:col-span-2 text-sm ${state.ok ? 'text-brand-600' : 'text-red-600'}`}>{state.message}</p>
      )}
      <div className="sm:col-span-2">
        <SubmitButton>Saqlash</SubmitButton>
      </div>
    </form>
  );
}

function Input({
  label,
  name,
  type = 'text',
  defaultValue,
  required,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
}) {
  return (
    <div>
      <label className="label" htmlFor={`zone-${name}`}>
        {label}
      </label>
      <input
        id={`zone-${name}`}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="input"
      />
    </div>
  );
}
