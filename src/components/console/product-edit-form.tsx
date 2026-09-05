'use client';

import { useState, useEffect, useRef } from 'react';
import { SubmitButton } from '@/components/ui/submit-button';
import type { Product } from '@/lib/types';

export function ProductEditForm({ productId, defaultValues }: { productId: string; defaultValues: Product }) {
  const existingUrl = defaultValues.product_images?.[0]?.url ?? '';
  const [imageUrl, setImageUrl] = useState(existingUrl);
  const [preview, setPreview] = useState<string>(existingUrl);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageUrl(existingUrl);
    setPreview(existingUrl);
  }, [existingUrl]);

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
      setImageUrl(data.url);
      setPreview(data.url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  }

  return (
    <form action="/api/console/products/save" method="POST" className="card space-y-4 p-6">
      <input type="hidden" name="id" value={productId} />
      <input type="hidden" name="image_url" value={imageUrl} />
      <div>
        <label className="label" htmlFor="name_uz">Nomi (uz)</label>
        <input id="name_uz" name="name_uz" className="input" required defaultValue={defaultValues.name_uz} />
      </div>
      <div>
        <label className="label" htmlFor="name_ru">Nomi (ru)</label>
        <input id="name_ru" name="name_ru" className="input" defaultValue={defaultValues.name_ru ?? ''} />
      </div>
      <div>
        <label className="label" htmlFor="description_uz">Tavsif (uz)</label>
        <textarea id="description_uz" name="description_uz" className="input" rows={3} defaultValue={defaultValues.description_uz ?? ''} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="price">Narx (so&apos;m)</label>
          <input id="price" name="price" className="input" required defaultValue={defaultValues.price} />
        </div>
        <div>
          <label className="label" htmlFor="weight_gram">Vazn (gramm)</label>
          <input id="weight_gram" name="weight_gram" className="input" defaultValue={defaultValues.weight_gram} />
        </div>
      </div>
      <div>
        <label className="label">Rasm</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="input"
          onChange={onFileChange}
        />
        {preview && (
          <img src={preview} alt="Preview" className="mt-2 h-40 w-40 rounded-lg object-cover" />
        )}
        {uploading && <p className="mt-1 text-xs text-ink-500">Yuklanmoqda…</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_active" defaultChecked={defaultValues.is_active} className="h-4 w-4" />
          <span className="text-sm">Sotuvda</span>
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="is_featured" defaultChecked={defaultValues.is_featured} className="h-4 w-4" />
          <span className="text-sm">Tanlangan</span>
        </label>
      </div>
      <SubmitButton className="w-full" pendingLabel="Saqlanmoqda…">Saqlash</SubmitButton>
    </form>
  );
}
