import { RemoteImage as Image } from '@/components/ui/remote-image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Trash2 } from 'lucide-react';
import { getCart } from '@/server/queries';
import { removeCartItem, setCartQuantity } from '@/server/actions/shop';
import { productImage } from '@/components/shop/product-card';
import { money } from '@/lib/format';
import { getSessionUser } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Savat' };
export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const [user, cart] = await Promise.all([getSessionUser(), getCart()]);

  if (!user) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-bold">Savat</h1>
        <p className="mt-2 text-sm text-ink-500">Savatni ko&apos;rish uchun tizimga kiring.</p>
        <Link href="/auth/login?next=/cart" className="btn-primary mt-4">
          Kirish
        </Link>
      </div>
    );
  }

  if (cart.items.length === 0) {
    return (
      <div className="card mx-auto max-w-md p-8 text-center">
        <h1 className="text-lg font-bold">Savat bo&apos;sh</h1>
        <p className="mt-2 text-sm text-ink-500">Katalogdan mahsulot tanlang.</p>
        <Link href="/catalog" className="btn-primary mt-4">
          Katalogga o&apos;tish
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <section className="space-y-3">
        <h1 className="text-xl font-bold">Savat ({cart.count} dona)</h1>
        {cart.items.map((item) => {
          const product = item.products;
          const available = product.stock - product.reserved;
          const max = Math.max(1, Math.min(available, product.max_per_order));
          return (
            <article key={item.id} className="card flex gap-3 p-3">
              <Link href={`/product/${product.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                <Image src={productImage(product)} alt={product.name_uz} fill sizes="96px" className="object-cover" />
              </Link>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/product/${product.slug}`} className="text-sm font-medium hover:text-brand-600">
                    {product.name_uz}
                  </Link>
                  <form action={removeCartItem}>
                    <input type="hidden" name="product_id" value={product.id} />
                    <button type="submit" className="btn-ghost px-2 text-red-600" aria-label="O'chirish">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
                <p className="text-xs text-ink-500">
                  {money(product.price)} · {(product.weight_gram / 1000).toFixed(2)} kg
                </p>
                <div className="mt-auto flex items-center justify-between">
                  <form action={setCartQuantity} className="flex items-center gap-2">
                    <input type="hidden" name="product_id" value={product.id} />
                    <input
                      type="number"
                      name="quantity"
                      min={1}
                      max={max}
                      defaultValue={item.quantity}
                      className="input w-20"
                      aria-label="Miqdor"
                    />
                    <button type="submit" className="btn-secondary">
                      Yangilash
                    </button>
                  </form>
                  <span className="font-semibold">{money(product.price * item.quantity)}</span>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      <aside className="card h-fit space-y-3 p-4 lg:sticky lg:top-28">
        <h2 className="font-semibold">Buyurtma</h2>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">Mahsulotlar</span>
          <span className="font-medium">{money(cart.itemsTotal)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-500">Umumiy vazn</span>
          <span className="font-medium">{(cart.weightGram / 1000).toFixed(2)} kg</span>
        </div>
        <p className="text-xs text-ink-500">
          Yetkazib berish narxi manzil tanlanganda hisoblanadi.
        </p>
        <Link href="/checkout" className="btn-primary w-full">
          Rasmiylashtirish
        </Link>
      </aside>
    </div>
  );
}
