import Link from 'next/link';
import {
  Bell,
  Database,
  FileText,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Star,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { consoleLogout } from '@/server/actions/console';
import type { ConsoleIdentity } from '@/lib/security/console';

const NAV = [
  { href: '/__console', label: 'Boshqaruv paneli', icon: LayoutDashboard },
  { href: '/__console/orders', label: 'Buyurtmalar', icon: ShoppingBag },
  { href: '/__console/products', label: 'Mahsulotlar', icon: Package },
  { href: '/__console/delivery', label: 'Yetkazib berish', icon: Truck },
  { href: '/__console/payments', label: "To'lovlar", icon: Wallet },
  { href: '/__console/users', label: 'Foydalanuvchilar', icon: Users },
  { href: '/__console/tickets', label: 'Murojaatlar', icon: LifeBuoy },
  { href: '/__console/reviews', label: 'Sharhlar', icon: Star },
  { href: '/__console/content', label: "Kontent va e'lonlar", icon: FileText },
  { href: '/__console/database', label: "Ma'lumotlar bazasi", icon: Database },
  { href: '/__console/security', label: 'Xavfsizlik', icon: ShieldCheck },
  { href: '/__console/settings', label: 'Sozlamalar', icon: Settings },
];

export function ConsoleShell({
  identity,
  children,
}: {
  identity: ConsoleIdentity;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-4">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-900 text-white">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold">Console</p>
            <p className="text-xs text-ink-500">{identity.role === 'admin' ? 'Egasi' : 'Menejer'}</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-2">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-ink-700 transition hover:bg-slate-100"
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-slate-100 p-3 text-xs text-ink-500">
          <p className="truncate">{identity.email}</p>
          <form action={consoleLogout} className="mt-2">
            <button type="submit" className="btn-secondary w-full">
              <LogOut className="h-4 w-4" />
              Chiqish
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          <span className="font-bold">Console</span>
          <form action={consoleLogout}>
            <button type="submit" className="btn-secondary py-1 text-xs">
              Chiqish
            </button>
          </form>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-ink-700"
            >
              {label}
            </Link>
          ))}
        </nav>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1">
            <Bell className="h-3.5 w-3.5" />
            Barcha imtiyozli amallar audit jurnalida saqlanadi.
          </span>
        </footer>
      </div>
    </div>
  );
}
