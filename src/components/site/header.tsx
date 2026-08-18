import Link from 'next/link';
import { Bell, LayoutGrid, LogIn, Package, Search, ShoppingCart, Store, User } from 'lucide-react';
import { getCart, getCategories, getMyNotifications, getStoreSettings } from '@/server/queries';
import { getSessionUser } from '@/lib/supabase/server';
import { CategoryBar } from './category-bar';

export async function Header() {
  const [categories, cart, user, settings] = await Promise.all([
    getCategories(),
    getCart(),
    getSessionUser(),
    getStoreSettings(),
  ]);
  const notifications = user ? await getMyNotifications() : [];
  const unread = notifications.filter((n) => !n.is_read).length;

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="hidden border-b border-slate-100 py-1.5 text-xs text-ink-500 md:block">
        <div className="container-page flex items-center justify-between">
          <span>Parkent tumani bo&apos;ylab yetkazib berish · 1 ish kunida</span>
          <div className="flex items-center gap-4">
            <Link href="/delivery" className="hover:text-brand-600">
              Yetkazib berish
            </Link>
            <Link href="/support" className="hover:text-brand-600">
              Yordam
            </Link>
            <a href={`tel:${settings.phone.replace(/\s/g, '')}`} className="hover:text-brand-600">
              {settings.phone}
            </a>
          </div>
        </div>
      </div>

      <div className="container-page flex items-center gap-3 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-500 text-white">
            <Store className="h-5 w-5" />
          </span>
          <span className="hidden text-lg font-extrabold tracking-tight sm:block">
            Parkent<span className="text-brand-600"> E-Mart</span>
          </span>
        </Link>

        <Link href="/catalog" className="btn-secondary hidden shrink-0 lg:inline-flex">
          <LayoutGrid className="h-4 w-4" />
          Katalog
        </Link>

        <form action="/catalog" className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            name="q"
            placeholder="Mahsulot qidirish… (guruch, yog', shakar)"
            className="input pl-9"
            aria-label="Qidirish"
          />
        </form>

        <nav className="flex shrink-0 items-center gap-1">
          {user && (
            <Link href="/notifications" className="btn-ghost relative px-2" aria-label="Bildirishnomalar">
              <Bell className="h-5 w-5" />
              {unread > 0 && (
                <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                  {unread}
                </span>
              )}
            </Link>
          )}
          <Link href="/orders" className="btn-ghost hidden px-2 sm:inline-flex" aria-label="Buyurtmalar">
            <Package className="h-5 w-5" />
          </Link>
          <Link href="/cart" className="btn-ghost relative px-2" aria-label="Savat">
            <ShoppingCart className="h-5 w-5" />
            {cart.count > 0 && (
              <span className="absolute right-0 top-0 grid h-4 min-w-4 place-items-center rounded-full bg-brand-500 px-1 text-[10px] font-bold text-white">
                {cart.count}
              </span>
            )}
          </Link>
          {user ? (
            <Link href="/profile" className="btn-ghost px-2" aria-label="Profil">
              <User className="h-5 w-5" />
            </Link>
          ) : (
            <Link href="/auth/login" className="btn-primary">
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Kirish</span>
            </Link>
          )}
        </nav>
      </div>

      <CategoryBar categories={categories} />
    </header>
  );
}
