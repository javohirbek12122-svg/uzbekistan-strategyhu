import Link from 'next/link';
import type { Metadata } from 'next';
import { ProductGrid } from '@/components/shop/product-card';
import { CATALOG_PAGE_SIZE, getCatalog, getCategories } from '@/server/queries';
import { cn } from '@/lib/format';

export const metadata: Metadata = { title: 'Katalog' };
export const dynamic = 'force-dynamic';

const SORTS = [
  { key: 'new', label: 'Yangi' },
  { key: 'popular', label: 'Ommabop' },
  { key: 'cheap', label: 'Arzon' },
  { key: 'expensive', label: 'Qimmat' },
  { key: 'rating', label: 'Reyting' },
] as const;

type Search = { category?: string; q?: string; sort?: string; min?: string; max?: string; page?: string };

function buildQuery(current: Search, patch: Partial<Search>): string {
  const params = new URLSearchParams();
  const merged = { ...current, ...patch };
  Object.entries(merged).forEach(([key, value]) => {
    if (value) params.set(key, String(value));
  });
  return `/catalog?${params.toString()}`;
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Search> }) {
  const search = await searchParams;
  const page = Number(search.page ?? '1') || 1;
  const sort = SORTS.find((s) => s.key === search.sort)?.key ?? 'new';

  let categories: unknown[] = [];
  let products: unknown[] = [];
  let total = 0;

  try {
    const [c, r] = await Promise.all([
      getCategories(),
      getCatalog({
        category: search.category,
        q: search.q,
        sort,
        min: search.min ? Number(search.min) : undefined,
        max: search.max ? Number(search.max) : undefined,
        page,
      }),
    ]);
    categories = c;
    products = r.products;
    total = r.total;
  } catch (err) {
    console.error('[CatalogPage]', err);
  }

  const pages = Math.max(1, Math.ceil(total / CATALOG_PAGE_SIZE));

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-4">
        <div className="card p-4">
          <h2 className="mb-3 text-sm font-semibold">Kategoriyalar</h2>
          <ul className="space-y-1 text-sm">
            <li>
              <Link
                href={buildQuery(search, { category: undefined, page: undefined })}
                className={cn('block rounded px-2 py-1', !search.category && 'bg-brand-50 font-medium text-brand-700')}
              >
                Barchasi
              </Link>
            </li>
            {categories
              .filter((c) => !c.parent_id)
              .map((category) => (
                <li key={category.id}>
                  <Link
                    href={buildQuery(search, { category: category.slug, page: undefined })}
                    className={cn(
                      'block rounded px-2 py-1 hover:bg-slate-50',
                      search.category === category.slug && 'bg-brand-50 font-medium text-brand-700',
                    )}
                  >
                    {category.name_uz}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <form action="/catalog" className="card space-y-3 p-4">
          {search.category && <input type="hidden" name="category" value={search.category} />}
          {search.q && <input type="hidden" name="q" value={search.q} />}
          <h2 className="text-sm font-semibold">Narx, so&apos;m</h2>
          <div className="flex items-center gap-2">
            <input name="min" defaultValue={search.min} placeholder="dan" className="input" inputMode="numeric" />
            <input name="max" defaultValue={search.max} placeholder="gacha" className="input" inputMode="numeric" />
          </div>
          <button type="submit" className="btn-secondary w-full">
            Qo&apos;llash
          </button>
        </form>
      </aside>

      <section>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">{search.q ? `“${search.q}” bo'yicha natijalar` : 'Katalog'}</h1>
            <p className="text-sm text-ink-500">{total} mahsulot</p>
          </div>
          <div className="flex gap-1 overflow-x-auto">
            {SORTS.map((option) => (
              <Link
                key={option.key}
                href={buildQuery(search, { sort: option.key, page: undefined })}
                className={cn(
                  'whitespace-nowrap rounded-full border px-3 py-1 text-sm',
                  sort === option.key
                    ? 'border-brand-500 bg-brand-50 font-medium text-brand-700'
                    : 'border-slate-200 bg-white text-ink-700 hover:bg-slate-50',
                )}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="card p-10 text-center text-sm text-ink-500">Mahsulot topilmadi.</div>
        ) : (
          <ProductGrid products={products} />
        )}

        {pages > 1 && (
          <nav className="mt-6 flex justify-center gap-1">
            {Array.from({ length: pages }, (_, index) => index + 1).map((number) => (
              <Link
                key={number}
                href={buildQuery(search, { page: String(number) })}
                className={cn(
                  'grid h-9 w-9 place-items-center rounded-lg border text-sm',
                  number === page ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-200 bg-white',
                )}
              >
                {number}
              </Link>
            ))}
          </nav>
        )}
      </section>
    </div>
  );
}
