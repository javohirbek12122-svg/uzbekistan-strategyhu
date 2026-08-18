import Link from 'next/link';
import { RemoteImage as Image } from '@/components/ui/remote-image';
import { notFound } from 'next/navigation';
import { consoleCategories, consoleProduct } from '@/server/console/queries';
import { ProductForm } from '@/components/console/product-form';
import { dateTime, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [{ product, history }, categories] = await Promise.all([consoleProduct(id), consoleCategories()]);
  if (!product) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">{product.name_uz}</h1>
        <div className="flex gap-2">
          <Link href={`/product/${product.slug}`} className="btn-secondary" target="_blank">
            Saytda ko&apos;rish
          </Link>
          <Link href="/__console/products" className="btn-secondary">
            Orqaga
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="card p-4">
          <ProductForm product={product} categories={categories} />
        </div>

        <aside className="space-y-4">
          <div className="card p-4">
            <h2 className="mb-2 font-semibold">Rasmlar</h2>
            <div className="grid grid-cols-3 gap-2">
              {(product.product_images ?? []).map((image) => (
                <Image
                  key={image.id}
                  src={image.url}
                  alt={image.alt ?? product.name_uz}
                  width={90}
                  height={90}
                  className="h-20 w-full rounded object-cover"
                />
              ))}
            </div>
            {(product.product_images ?? []).length === 0 && <p className="text-sm text-ink-500">Rasm yo&apos;q.</p>}
          </div>

          <div className="card p-4">
            <h2 className="mb-2 font-semibold">Narx tarixi</h2>
            <ul className="space-y-1 text-sm">
              {history.map((row) => (
                <li key={row.id} className="flex items-center justify-between gap-2">
                  <span>
                    {row.old_price ? `${money(row.old_price)} → ` : ''}
                    <strong>{money(row.new_price)}</strong>
                  </span>
                  <span className="text-xs text-ink-500">{dateTime(row.created_at)}</span>
                </li>
              ))}
              {history.length === 0 && <li className="text-ink-500">O&apos;zgarish yo&apos;q.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
