import Link from 'next/link';
import { RemoteImage as Image } from '@/components/ui/remote-image';
import { Plus } from 'lucide-react';
import { consoleProducts } from '@/server/console/queries';
import { deleteProduct, toggleProduct } from '@/server/actions/console';
import { productImage } from '@/components/shop/product-card';
import { money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ConsoleProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q = '', page } = await searchParams;
  const current = Number(page ?? '1') || 1;
  const { products, total } = await consoleProducts(q, current);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Mahsulotlar ({total})</h1>
        <div className="flex gap-2">
          <form action="/__console/products" className="flex gap-2">
            <input name="q" defaultValue={q} placeholder="Nomi bo'yicha" className="input w-44" />
            <button type="submit" className="btn-secondary">
              Qidirish
            </button>
          </form>
          <Link href="/__console/products/new" className="btn-primary">
            <Plus className="h-4 w-4" />
            Yangi
          </Link>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="table-base">
          <thead>
            <tr>
              <th>Mahsulot</th>
              <th>Narx</th>
              <th>Ombor</th>
              <th>Reyting</th>
              <th>Holat</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <Image
                      src={productImage(product)}
                      alt={product.name_uz}
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/__console/products/${product.id}`}
                        className="block truncate font-medium text-brand-700 hover:underline"
                      >
                        {product.name_uz}
                      </Link>
                      <span className="text-xs text-ink-500">{product.sku}</span>
                    </div>
                  </div>
                </td>
                <td>
                  {money(product.price)}
                  {product.compare_at_price ? (
                    <span className="block text-xs text-ink-500 line-through">{money(product.compare_at_price)}</span>
                  ) : null}
                </td>
                <td className={product.stock < 5 ? 'font-semibold text-red-600' : ''}>{product.stock}</td>
                <td className="text-xs text-ink-500">
                  {Number(product.rating ?? 0).toFixed(1)} ({product.reviews_count ?? 0})
                </td>
                <td>
                  <span className={`badge ${product.is_active ? 'bg-brand-50 text-brand-700' : 'bg-slate-100 text-ink-500'}`}>
                    {product.is_active ? 'Sotuvda' : 'Yopilgan'}
                  </span>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    <form action={toggleProduct}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="btn-secondary py-1 text-xs">
                        {product.is_active ? 'Yopish' : 'Ochish'}
                      </button>
                    </form>
                    <form action={deleteProduct}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="btn-danger py-1 text-xs">
                        O&apos;chirish
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-center text-sm text-ink-500">Mahsulot topilmadi.</p>}
      </div>

      <div className="flex justify-between text-sm">
        {current > 1 ? (
          <Link href={`/__console/products?page=${current - 1}&q=${q}`} className="btn-secondary">
            Oldingi
          </Link>
        ) : (
          <span />
        )}
        {current * 30 < total && (
          <Link href={`/__console/products?page=${current + 1}&q=${q}`} className="btn-secondary">
            Keyingi
          </Link>
        )}
      </div>
    </div>
  );
}
