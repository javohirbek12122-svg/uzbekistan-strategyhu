'use client';

import { useActionState } from 'react';
import { saveProduct } from '@/server/actions/console';
import { initialFormState } from '@/lib/validation';
import { SubmitButton } from '@/components/ui/submit-button';
import type { Category, Product } from '@/lib/types';

export function ProductForm({ product, categories }: { product?: Product | null; categories: Category[] }) {
  const [state, action] = useActionState(saveProduct, initialFormState);
  const errors = state?.fieldErrors ?? {};

  return (
    <form action={action} className="grid gap-4 md:grid-cols-2">
      {product && <input type="hidden" name="id" value={product.id} />}

      <Field label="Nomi (uz)" name="name_uz" defaultValue={product?.name_uz} errors={errors} required />
      <Field label="Nomi (ru)" name="name_ru" defaultValue={product?.name_ru ?? ''} errors={errors} />
      <Field label="Slug" name="slug" defaultValue={product?.slug} errors={errors} required hint="masalan: coca-cola-1l" />
      <Field label="SKU" name="sku" defaultValue={product?.sku} errors={errors} required />

      <div className="md:col-span-2">
        <label className="label" htmlFor="description_uz">
          Tavsif
        </label>
        <textarea
          id="description_uz"
          name="description_uz"
          rows={4}
          defaultValue={product?.description_uz ?? ''}
          className="input"
        />
      </div>

      <div>
        <label className="label" htmlFor="category_id">
          Kategoriya
        </label>
        <select id="category_id" name="category_id" className="input" defaultValue={product?.category_id ?? ''}>
          <option value="">— tanlanmagan —</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name_uz}
            </option>
          ))}
        </select>
      </div>
      <Field label="Rasm URL (yangi qo'shish)" name="image_url" errors={errors} />

      <Field label="Narx (so'm)" name="price" type="number" defaultValue={product?.price} errors={errors} required />
      <Field
        label="Eski narx (chegirma uchun)"
        name="compare_at_price"
        type="number"
        defaultValue={product?.compare_at_price ?? ''}
        errors={errors}
      />
      <Field label="Og'irlik (gramm)" name="weight_gram" type="number" defaultValue={product?.weight_gram ?? 0} errors={errors} required />
      <Field label="Ombor (dona)" name="stock" type="number" defaultValue={product?.stock ?? 0} errors={errors} required />
      <Field
        label="Bir buyurtmada maksimum"
        name="max_per_order"
        type="number"
        defaultValue={product?.max_per_order ?? 10}
        errors={errors}
        required
      />

      <div className="flex items-center gap-6 md:col-span-2">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_active" defaultChecked={product?.is_active ?? true} /> Sotuvda
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="is_featured" defaultChecked={product?.is_featured ?? false} /> Tanlangan
        </label>
      </div>

      {state?.message && (
        <p className={`md:col-span-2 text-sm ${state.ok ? 'text-brand-600' : 'text-red-600'}`}>{state.message}</p>
      )}

      <div className="md:col-span-2">
        <SubmitButton>Saqlash</SubmitButton>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  errors,
  type = 'text',
  defaultValue,
  required,
  hint,
}: {
  label: string;
  name: string;
  errors: Record<string, string[]>;
  type?: string;
  defaultValue?: string | number | null;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue ?? ''}
        required={required}
        className="input"
      />
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
      {errors[name] && <p className="mt-1 text-xs text-red-600">{errors[name][0]}</p>}
    </div>
  );
}
