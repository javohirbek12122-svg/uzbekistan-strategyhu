import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Clock, Package, ShieldCheck, Star, Truck } from 'lucide-react';
import { getProductBySlug, getProductReviews, getZones } from '@/server/queries';
import { productImage } from '@/components/shop/product-card';
import { AddToCartButton } from '@/components/shop/add-to-cart-button';
import { discountPercent, money } from '@/lib/format';
import { calcDeliveryFee, formatEta } from '@/lib/delivery';
import { dateTime } from '@/lib/format';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  return { title: product?.name_uz ?? 'Mahsulot' };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [reviews, zones] = await Promise.all([getProductReviews(product.id), getZones()]);
  const off = discountPercent(product.price, product.compare_at_price);
  const available = product.stock - product.reserved;
  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-8">
      <nav className="text-sm text-ink-500">
        <Link href="/" className="hover:text-brand-600">Asosiy</Link>
        <span className="mx-1">/</span>
        <Link href="/catalog" className="hover:text-brand-600">Katalog</Link>
        {product.categories && (
          <>
            <span className="mx-1">/</span>
            <Link href={`/catalog?category=${product.categories.slug}`} className="hover:text-brand-600">
              {product.categories.name_uz}
            </Link>
          </>
        )}
      </nav>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr_320px]">
        <div className="space-y-3">
          <div className="card relative aspect-square overflow-hidden">
            <Image
              src={productImage(product)}
              alt={product.name_uz}
              fill
              sizes="(max-width: 1024px) 100vw, 420px"
              className="object-cover"
              priority
            />
            {off !== null && <span className="absolute left-3 top-3 badge bg-red-600 text-white">-{off}%</span>}
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.slice(0, 4).map((image) => (
                <div key={image.id} className="card relative aspect-square overflow-hidden">
                  <Image src={image.url} alt={image.alt ?? product.name_uz} fill sizes="100px" className="object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl font-bold">{product.name_uz}</h1>
          <div className="flex items-center gap-3 text-sm text-ink-500">
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent-500 text-accent-500" />
              {product.rating.toFixed(1)} ({product.reviews_count})
            </span>
            <span>·</span>
            <span>{product.sold_count} sotilgan</span>
            <span>·</span>
            <span>SKU: {product.sku}</span>
          </div>

          {product.description_uz && (
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink-700">{product.description_uz}</p>
          )}

          <dl className="card divide-y divide-slate-100 text-sm">
            <Row label="Vazn" value={`${(product.weight_gram / 1000).toFixed(2)} kg`} />
            <Row label="Omborda" value={available > 0 ? `${available} dona` : "Tugagan"} />
            <Row label="Bir buyurtmada" value={`${product.max_per_order} donagacha`} />
          </dl>

          <div className="card space-y-2 p-4 text-sm">
            <p className="font-semibold">Yetkazib berish narxi (taxminiy)</p>
            {zones.map((zone) => (
              <div key={zone.id} className="flex items-center justify-between text-ink-500">
                <span>{zone.name_uz}</span>
                <span>
                  {money(calcDeliveryFee({ zone, weightGram: product.weight_gram, itemsTotal: product.price }))} ·{' '}
                  {formatEta(zone)}
                </span>
              </div>
            ))}
            <p className="text-xs text-ink-500">
              Aniq summa buyurtma rasmiylashtirilganda server tomonida hisoblanadi.
            </p>
          </div>
        </div>

        <aside className="space-y-3">
          <div className="card space-y-3 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold">{money(product.price)}</span>
              {off !== null && (
                <span className="text-sm text-slate-400 line-through">{money(product.compare_at_price!)}</span>
              )}
            </div>
            <AddToCartButton productId={product.id} disabled={available <= 0} className="w-full" />
            <Link href="/cart" className="btn-secondary w-full">
              Savatga o&apos;tish
            </Link>
            <ul className="space-y-2 pt-2 text-xs text-ink-500">
              <li className="flex items-center gap-2"><Truck className="h-4 w-4" /> Parkent bo&apos;ylab yetkazib berish</li>
              <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> Kechiksa 5 000 so&apos;m qoplama</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Payme / Click / naqd</li>
              <li className="flex items-center gap-2"><Package className="h-4 w-4" /> Aniq vazn kafolati</li>
            </ul>
          </div>
        </aside>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Sharhlar ({reviews.length})</h2>
        {reviews.length === 0 ? (
          <p className="card p-6 text-sm text-ink-500">Hozircha sharh yo&apos;q. Mahsulotni sotib olgach sharh qoldirishingiz mumkin.</p>
        ) : (
          <ul className="space-y-3">
            {reviews.map((review) => (
              <li key={review.id} className="card p-4">
                <div className="flex items-center gap-2 text-sm">
                  <span className="inline-flex">
                    {Array.from({ length: 5 }, (_, index) => (
                      <Star
                        key={index}
                        className={index < review.rating ? 'h-4 w-4 fill-accent-500 text-accent-500' : 'h-4 w-4 text-slate-300'}
                      />
                    ))}
                  </span>
                  <span className="text-xs text-ink-500">{dateTime(review.created_at)}</span>
                </div>
                {review.body && <p className="mt-2 text-sm text-ink-700">{review.body}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <dt className="text-ink-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
