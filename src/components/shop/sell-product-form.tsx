'use client';

import { useActionState } from 'react';
import { submitUserProduct } from '@/server/actions/shop';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';

export function SellProductForm() {
  const [state, action] = useActionState(submitUserProduct, initialFormState);

  return (
    <form action={action} className="card space-y-3 p-4">
      <div>
        <label className="label" htmlFor="name_uz">
          Mahsulot nomi
        </label>
        <input id="name_uz" name="name_uz" className="input" required minLength={2} />
      </div>
      <div>
        <label className="label" htmlFor="description_uz">
          Tavsif
        </label>
        <textarea id="description_uz" name="description_uz" className="input" rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="price">
            Narx (so&apos;m)
          </label>
          <input id="price" name="price" type="number" className="input" required min={0} />
        </div>
        <div>
          <label className="label" htmlFor="weight_gram">
            Vazn (gramm)
          </label>
          <input id="weight_gram" name="weight_gram" type="number" className="input" min={0} />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="image_url">
          Rasm URL
        </label>
        <input id="image_url" name="image_url" type="url" className="input" placeholder="https://..." />
      </div>
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
        <p className="text-xs font-semibold text-amber-800">Shaxsiy ma&apos;lumotlar (maxfiylik kafolati)</p>
        <p className="text-xs text-ink-500">
          Bu ma&apos;lumotlar faqat identifikatsiya uchun ishlatiladi va uchinchi shaxslarga berilmaydi.
        </p>
        <div>
          <label className="label" htmlFor="passport_id">
            Pasport seriya va raqami
          </label>
          <input id="passport_id" name="passport_id" className="input" placeholder="AA1234567" />
        </div>
        <div>
          <label className="label" htmlFor="card_number">
            Karta raqami (oxirgi 4 raqam)
          </label>
          <input id="card_number" name="card_number" className="input" placeholder="****1234" maxLength={4} />
        </div>
      </div>
      {state?.message && (
        <p className={state.ok ? 'text-sm text-brand-600' : 'text-sm text-red-600'}>{state.message}</p>
      )}
      <SubmitButton className="w-full">Yuborish</SubmitButton>
    </form>
  );
}
