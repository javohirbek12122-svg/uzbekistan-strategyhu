import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Hero } from '@/components/site/hero';
import { ProductGrid } from '@/components/shop/product-card';
import { CategoryIcon } from '@/components/shop/category-icon';
import { getBanners, getCategories, getFeaturedProducts, getNewProducts, getZones } from '@/server/queries';
import { money } from '@/lib/format';
import { formatEta } from '@/lib/delivery';
import { SetupNotice } from '@/components/site/setup-notice';
import { isSupabaseConfigured } from '@/lib/env';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const [banners, categories, featured, fresh, zones] = await Promise.all([
    getBanners(),
    getCategories(),
    getFeaturedProducts(10),
    getNewProducts(10),
    getZones(),
  ]);

  return (
    <div className="space-y-8">
      {!isSupabaseConfigured && <SetupNotice />}
      <Hero banners={banners} />

      {categories.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Kategoriyalar</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {categories
              .filter((c) => !c.parent_id)
              .map((category) => (
                <Link
                  key={category.id}
                  href={`/catalog?category=${category.slug}`}
                  className="card flex flex-col items-center gap-2 p-4 text-center transition hover:shadow-lift"
                >
                  <CategoryIcon name={category.icon} className="h-7 w-7 text-brand-600" />
                  <span className="text-sm font-medium">{category.name_uz}</span>
                </Link>
              ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <Section title="Tanlangan mahsulotlar" href="/catalog?sort=popular">
          <ProductGrid products={featured} />
        </Section>
      )}

      {fresh.length > 0 && (
        <Section title="Yangi qo'shilganlar" href="/catalog?sort=new">
          <ProductGrid products={fresh} />
        </Section>
      )}

      {zones.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">Yetkazib berish hududlari</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <div key={zone.id} className="card p-4">
                <p className="font-semibold">{zone.name_uz}</p>
                <p className="mt-1 text-sm text-ink-500">
                  {money(zone.base_fee)} — {money(zone.max_fee)}
                </p>
                <p className="text-xs text-ink-500">{formatEta(zone)}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Section({ title, href, children }: { title: string; href: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">
          Barchasi <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}
