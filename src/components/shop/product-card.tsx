import { RemoteImage as Image } from '@/components/ui/remote-image';
import Link from 'next/link';
import { Star } from 'lucide-react';
import { discountPercent, money } from '@/lib/format';
import type { Product } from '@/lib/types';
import { AddToCartButton } from './add-to-cart-button';

const PLACEHOLDER = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=70';

export function productImage(product: Product): string {
  const images = [...(product.product_images ?? [])].sort((a, b) => a.position - b.position);
  return images[0]?.url ?? PLACEHOLDER;
}

export function ProductCard({ product }: { product: Product }) {
  const off = discountPercent(product.price, product.compare_at_price);
  const available = product.stock - product.reserved;

  return (
    <article className="card group flex flex-col overflow-hidden transition hover:shadow-lift">
      <Link href={`/product/${product.slug}`} className="relative block aspect-square overflow-hidden bg-slate-100">
        <Image
          src={productImage(product)}
          alt={product.name_uz}
          fill
          sizes="(max-width: 640px) 50vw, 240px"
          className="object-cover transition duration-300 group-hover:scale-105"
        />
        {off !== null && (
          <span className="absolute left-2 top-2 badge bg-red-600 text-white">-{off}%</span>
        )}
        {available <= 0 && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 py-1 text-center text-xs font-medium text-white">
            Vaqtincha yo&apos;q
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/product/${product.slug}`} className="line-clamp-2 text-sm font-medium hover:text-brand-600">
          {product.name_uz}
        </Link>

        <div className="mt-auto">
          <div className="flex items-center gap-1 text-xs text-ink-500">
            <Star className="h-3.5 w-3.5 fill-accent-500 text-accent-500" />
            {product.rating.toFixed(1)}
            <span className="text-slate-300">•</span>
            {product.sold_count} sotilgan
          </div>
          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-base font-bold">{money(product.price)}</span>
            {off !== null && (
              <span className="text-xs text-slate-400 line-through">{money(product.compare_at_price!)}</span>
            )}
          </div>
        </div>

        <AddToCartButton productId={product.id} disabled={available <= 0} className="w-full" />
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
