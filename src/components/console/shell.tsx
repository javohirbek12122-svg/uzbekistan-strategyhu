import Link from 'next/link';
import {
  Activity,
  BarChart3,
  Bell,
  Bot,
  Boxes,
  Database,
  FileText,
  Gauge,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Megaphone,
  Package,
  PanelTop,
  Settings,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
  Users,
  Wallet,
  Workflow,
} from 'lucide-react';
import { consoleLogout } from '@/server/actions/console';
import type { ConsoleIdentity } from '@/lib/security/console';

const GROUPS = [
  {
    title: 'COMMAND',
    items: [
      { href: '/__console', label: 'Command Center', icon: Gauge },
      { href: '/__console/analytics', label: 'Analitika', icon: BarChart3 },
      { href: '/__console/activity', label: 'Activity & Audit', icon: Activity },
      { href: '/__console/health', label: 'System Health', icon: PanelTop },
    ],
  },
  {
    title: 'COMMERCE',
    items: [
      { href: '/__console/orders', label: 'Buyurtmalar', icon: ShoppingBag },
      { href: '/__console/products', label: 'Mahsulotlar', icon: Package },
      { href: '/__console/inventory', label: 'Inventar', icon: Boxes },
      { href: '/__console/delivery', label: 'Yetkazib berish', icon: Truck },
      { href: '/__console/couriers', label: 'Kuryerlar', icon: Truck },
    ],
  },
  {
    title: 'GROWTH',
    items: [
      { href: '/__console/customers', label: 'Customer 360', icon: Users },
      { href: '/__console/marketing', label: 'Marketing', icon: Megaphone },
      { href: '/__console/reviews', label: 'Sharhlar', icon: Star },
      { href: '/__console/content', label: 'Kontent', icon: FileText },
    ],
  },
  {
    title: 'MONEY & SUPPORT',
    items: [
      { href: '/__console/finance', label: 'Moliya', icon: Wallet },
      { href: '/__console/payments', label: 'To‘lovlar', icon: Wallet },
      { href: '/__console/tickets', label: 'Murojaatlar', icon: LifeBuoy },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { href: '/__console/ai', label: 'AI Control Center', icon: Bot },
      { href: '/__console/automation', label: 'Automation Hub', icon: Workflow },
      { href: '/__console/risk', label: 'Risk Center', icon: ShieldCheck },
      { href: '/__console/features', label: 'Feature Control', icon: Sparkles },
    ],
  },
  {
    title: 'GOVERNANCE',
    items: [
      { href: '/__console/users', label: 'Foydalanuvchilar', icon: Users },
      { href: '/__console/security', label: 'Xavfsizlik', icon: ShieldCheck },
      { href: '/__console/database', label: "Ma'lumotlar bazasi", icon: Database },
      { href: '/__console/settings', label: 'Sozlamalar', icon: Settings },
    ],
  },
] as const;

export function ConsoleShell({
  identity,
  children,
}: {
  identity: ConsoleIdentity;
  children: React.ReactNode;
}) {
  const navItems: Array<{ href: string; label: string }> = GROUPS.reduce((items, group) => {
    group.items.forEach((item) => items.push({ href: item.href, label: item.label }));
    return items;
  }, []);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="border-b border-slate-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-slate-950 text-white shadow-sm"><Gauge className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-sm font-black tracking-tight">PARKENT E‑MART</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-600">Command Console</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-xs text-emerald-700"><span className="block text-[10px] uppercase">Store</span><strong>LIVE</strong></div>
            <div className="rounded-xl bg-violet-50 p-2.5 text-xs text-violet-700"><span className="block text-[10px] uppercase">AI</span><strong>CONTROLLED</strong></div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-3">
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-3 pb-2 text-[10px] font-black tracking-[0.18em] text-slate-400">{group.title}</p>
              <div className="space-y-1">
                {group.items.map(({ href, label, icon: Icon }) => (
                  <Link key={href} href={href} className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-700 transition hover:bg-slate-100 hover:text-slate-950">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-3">
          <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2 text-xs">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400">Access</span>
            <strong className="block truncate text-slate-800">{identity.email}</strong>
            <span className="text-ink-500">{identity.role === 'admin' ? 'Owner / Admin' : 'Manager'}</span>
          </div>
          <form action={consoleLogout}>
            <button type="submit" className="btn-secondary w-full"><LogOut className="h-4 w-4" /> Chiqish</button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur lg:px-6">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-white lg:hidden"><Gauge className="h-4 w-4" /></span>
            <div><p className="text-sm font-bold">Admin Command Console</p><p className="text-xs text-ink-500">{identity.role === 'admin' ? 'Owner access' : 'Manager access'}</p></div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/__console/ai" className="btn-secondary py-1.5 text-xs"><Bot className="h-4 w-4" /> AI</Link>
            <Link href="/__console/security" className="btn-secondary py-1.5 text-xs"><ShieldCheck className="h-4 w-4" /> Security</Link>
          </div>
        </header>

        <div className="border-b border-slate-200 bg-white px-2 py-2 lg:hidden">
          <div className="flex gap-1 overflow-x-auto pb-1">
            {navItems.map(({ href, label }) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-ink-700">
                {label}
              </Link>
            ))}
          </div>
        </div>

        <main className="min-w-0 flex-1 p-4 lg:p-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white px-4 py-3 text-xs text-ink-500">
          <span className="inline-flex items-center gap-1"><Bell className="h-3.5 w-3.5" /> Har bir imtiyozli amal audit jurnaliga yoziladi.</span>
        </footer>
      </div>
    </div>
  );
}
