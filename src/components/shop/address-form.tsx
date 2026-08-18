'use client';

import { useActionState, useState } from 'react';
import { LocateFixed, MapPin } from 'lucide-react';
import { saveAddress } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { resolveZoneByPoint } from '@/lib/delivery';
import { SubmitButton } from '@/components/ui/submit-button';
import type { DeliveryZone } from '@/lib/types';

const PARKENT = { lat: 41.2967, lng: 69.6789 };

/**
 * Address form with map pinning. The pin is kept as lat/lng and the zone is
 * pre-selected from the pin, but the delivery fee is always recomputed by the
 * database at checkout.
 */
export function AddressForm({ zones }: { zones: DeliveryZone[] }) {
  const [state, action] = useActionState(saveAddress, initialFormState);
  const [point, setPoint] = useState(PARKENT);
  const [zoneId, setZoneId] = useState<string>(zones[0]?.id ?? '');
  const [geoError, setGeoError] = useState<string | null>(null);

  const applyPoint = (next: { lat: number; lng: number }) => {
    setPoint(next);
    const zone = resolveZoneByPoint(zones, next);
    if (zone) setZoneId(zone.id);
  };

  const locate = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Brauzer joylashuvni qo\u2019llab-quvvatlamaydi');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => applyPoint({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => setGeoError('Joylashuvga ruxsat berilmadi — nuqtani qo\u2019lda kiriting'),
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const bbox = `${point.lng - 0.01}%2C${point.lat - 0.008}%2C${point.lng + 0.01}%2C${point.lat + 0.008}`;
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="card space-y-3 p-4">
      <h2 className="font-semibold">Yangi manzil</h2>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Qabul qiluvchi" name="recipient_name" errors={errors.recipient_name} required />
        <Field label="Telefon" name="phone" placeholder="+998901234567" errors={errors.phone} required />
      </div>
      <Field label="Manzil (mahalla, ko'cha, uy)" name="line1" errors={errors.line1} required />
      <Field label="Mo'ljal (ixtiyoriy)" name="landmark" errors={errors.landmark} />

      <div>
        <label className="label" htmlFor="zone_id">
          Hudud
        </label>
        <select
          id="zone_id"
          name="zone_id"
          className="input"
          value={zoneId}
          onChange={(event) => setZoneId(event.target.value)}
        >
          {zones.map((zone) => (
            <option key={zone.id} value={zone.id}>
              {zone.name_uz}
            </option>
          ))}
        </select>
        {errors.zone_id && <p className="mt-1 text-xs text-red-600">{errors.zone_id[0]}</p>}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="label mb-0 flex items-center gap-1">
            <MapPin className="h-4 w-4" /> Xaritada nuqta
          </span>
          <button type="button" onClick={locate} className="btn-secondary py-1 text-xs">
            <LocateFixed className="h-3.5 w-3.5" />
            Joylashuvim
          </button>
        </div>
        <iframe
          title="Manzil xaritasi"
          className="h-56 w-full rounded-lg border border-slate-200"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${point.lat}%2C${point.lng}`}
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className="input"
            name="lat"
            value={point.lat}
            onChange={(event) => applyPoint({ ...point, lat: Number(event.target.value) })}
            aria-label="Kenglik"
          />
          <input
            className="input"
            name="lng"
            value={point.lng}
            onChange={(event) => applyPoint({ ...point, lng: Number(event.target.value) })}
            aria-label="Uzunlik"
          />
        </div>
        {geoError && <p className="text-xs text-amber-700">{geoError}</p>}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="is_default" value="true" className="h-4 w-4 rounded border-slate-300" />
        Asosiy manzil sifatida saqlash
      </label>

      {state?.message && (
        <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>
      )}
      <SubmitButton className="w-full">Manzilni saqlash</SubmitButton>
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
