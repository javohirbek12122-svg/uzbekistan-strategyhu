import Link from 'next/link';
import { ArrowUpRight, Bot, CircleAlert, CircleCheck, Database, Gauge, ShieldCheck } from 'lucide-react';
import { controlSnapshot } from '@/server/console/control';
import { money } from '@/lib/format';

export type ConsoleModule =
  | 'analytics' | 'inventory' | 'marketing' | 'customers' | 'finance' | 'couriers'
  | 'automation' | 'ai' | 'risk' | 'activity' | 'health';

const modules: Record<ConsoleModule, {
  title: string;
  subtitle: string;
  links: Array<{ label: string; href: string }>;
}> = {
  analytics: { title: 'Analitika', subtitle: 'Savdo, buyurtma, tushum va operatsion KPIlar.', links: [{ label: 'Buyurtmalar', href: '/__console/orders' }, { label: 'Moliya', href: '/__console/finance' }] },
  inventory: { title: 'Inventar Control', subtitle: 'Zaxira, sotuv tezligi va tugayotgan mahsulotlarni boshqaring.', links: [{ label: 'Mahsulotlar', href: '/__console/products' }, { label: 'Yangi mahsulot', href: '/__console/products/new' }] },
  marketing: { title: 'Marketing Control', subtitle: 'Banner, e’lon, promo va savdo o‘sishi uchun yagona markaz.', links: [{ label: 'Kontent', href: '/__console/content' }, { label: 'Sozlamalar', href: '/__console/settings' }] },
  customers: { title: 'Customer 360', subtitle: 'Mijozlar, rollar, bloklash va murojaatlar boshqaruvi.', links: [{ label: 'Foydalanuvchilar', href: '/__console/users' }, { label: 'Murojaatlar', href: '/__console/tickets' }] },
  finance: { title: 'Finance Control', subtitle: 'To‘lovlar, failed payment va qaytarishlar uchun nazorat markazi.', links: [{ label: 'To‘lovlar', href: '/__console/payments' }, { label: 'Buyurtmalar', href: '/__console/orders' }] },
  couriers: { title: 'Logistics Control', subtitle: 'Kuryer taqsimoti, shipment va SLA boshqaruvi.', links: [{ label: 'Yetkazib berish', href: '/__console/delivery' }, { label: 'Buyurtmalar', href: '/__console/orders' }] },
  automation: { title: 'Automation Hub', subtitle: 'Avtomatik jarayonlar, nazorat va keyingi ishlarni markazlashtirish.', links: [{ label: 'AI Control', href: '/__console/ai' }, { label: 'Xavfsizlik', href: '/__console/security' }] },
  ai: { title: 'AI Control Center', subtitle: 'AI monitoring, tavsiyalar va tasdiq talab qiluvchi amallarni boshqarish.', links: [{ label: 'Activity', href: '/__console/activity' }, { label: 'Security', href: '/__console/security' }] },
  risk: { title: 'Risk Center', subtitle: 'Inventar, logistika, to‘lov va xavfsizlik risklarini bir oynaga yig‘ish.', links: [{ label: 'Finance', href: '/__console/finance' }, { label: 'Security', href: '/__console/security' }] },
  activity: { title: 'Activity & Audit', subtitle: 'Imtiyozli harakatlar va tizim voqealarining izchil jurnali.', links: [{ label: 'Security', href: '/__console/security' }, { label: 'Database', href: '/__console/database' }] },
  health: { title: 'System Health', subtitle: 'Platforma, ma’lumotlar va operatsion qatlam holatini kuzating.', links: [{ label: 'Database', href: '/__console/database' }, { label: 'Security', href: '/__console/security' }] },
};

export async function ConsoleModulePage({ module }: { module: ConsoleModule }) {
  const data = await controlSnapshot();
  const cfg = modules[module];

  const stats = [
    ['Buyurtmalar', String(data.ordersTotal)],
    ['30 kunlik tushum', money(data.revenue30d)],
    ['Faol mahsulot', String(data.activeProducts)],
    ['Mijozlar', String(data.customers)],
    ['Past zaxira', String(data.lowStock)],
    ['Kechikishlar', String(data.lateShipments)],
  ] as const;

  const warnings = [
    data.lowStock > 0 ? { title: 'Inventar signali', body: data.lowStock + ' ta mahsulot 5 donadan kam.', danger: false } : null,
    data.outOfStock > 0 ? { title: '0 zaxira', body: data.outOfStock + ' ta faol mahsulot tugagan.', danger: true } : null,
    data.lateShipments > 0 ? { title: 'SLA signali', body: data.lateShipments + ' ta yetkazish kechikmoqda.', danger: true } : null,
    data.failedPayments24h > 0 ? { title: 'To‘lov signali', body: data.failedPayments24h + ' ta failed payment / 24 soat.', danger: true } : null,
    data.pendingReviews > 0 ? { title: 'Moderatsiya', body: data.pendingReviews + ' ta sharh navbatda.', danger: false } : null,
  ].filter(Boolean) as Array<{ title: string; body: string; danger: boolean }>;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-600"><Gauge className="h-3.5 w-3.5" /> PRO MODULE</div>
          <h1 className="text-2xl font-black tracking-tight">{cfg.title}</h1>
          <p className="mt-1 max-w-3xl text-sm text-ink-500">{cfg.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {cfg.links.map((item) => <Link key={item.href} href={item.href} className="btn-secondary">{item.label}<ArrowUpRight className="h-4 w-4" /></Link>)}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map(([label, value]) => <div key={label} className="card p-4"><p className="text-xs text-ink-500">{label}</p><p className="mt-1 text-xl font-black">{value}</p></div>)}
      </div>


      {module === 'inventory' && (
        <section className="card overflow-x-auto">
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="font-bold">Past zaxira — real ro‘yxat</h2>
            <p className="text-xs text-ink-500">AI va operatsion nazorat uchun muhim SKUlar</p>
          </div>
          <table className="table-base">
            <thead><tr><th>Mahsulot</th><th>Zaxira</th><th>Sotilgan</th></tr></thead>
            <tbody>
              {data.lowStockProducts.map((row) => <tr key={row.id}><td>{row.name_uz}</td><td className={row.stock === 0 ? 'font-bold text-red-600' : 'font-semibold text-amber-600'}>{row.stock}</td><td>{row.sold_count}</td></tr>)}
            </tbody>
          </table>
          {data.lowStockProducts.length === 0 && <p className="p-5 text-sm text-ink-500">Past zaxiradagi mahsulot yo‘q.</p>}
        </section>
      )}

      {module === 'customers' && (
        <section className="card overflow-x-auto">
          <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold">Yangi mijozlar</h2></div>
          <table className="table-base">
            <thead><tr><th>Ism</th><th>Email</th><th>Sana</th></tr></thead>
            <tbody>{data.recentCustomers.map((row) => <tr key={row.id}><td>{row.full_name ?? '—'}</td><td>{row.email ?? '—'}</td><td className="text-xs text-ink-500">{new Date(row.created_at).toLocaleDateString('uz-UZ')}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      {module === 'finance' && (
        <section className="card overflow-x-auto">
          <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold">Failed payment queue</h2><p className="text-xs text-ink-500">Oxirgi 10 ta muvaffaqiyatsiz to‘lov</p></div>
          <table className="table-base">
            <thead><tr><th>Provayder</th><th>Summa</th><th>Transaction</th><th>Sana</th></tr></thead>
            <tbody>{data.failedPaymentRows.map((row) => <tr key={row.id}><td className="uppercase">{row.provider}</td><td>{money(Number(row.amount))}</td><td className="max-w-[220px] truncate">{row.provider_transaction_id ?? '—'}</td><td className="text-xs text-ink-500">{new Date(row.created_at).toLocaleString('uz-UZ')}</td></tr>)}</tbody>
          </table>
          {data.failedPaymentRows.length === 0 && <p className="p-5 text-sm text-ink-500">Failed payment yo‘q.</p>}
        </section>
      )}

      {module === 'couriers' && (
        <section className="card overflow-x-auto">
          <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold">Shipment board</h2><p className="text-xs text-ink-500">Faol yetkazishlar va kuryer taqsimoti</p></div>
          <table className="table-base">
            <thead><tr><th>Buyurtma</th><th>Status</th><th>Kuryer</th><th>Reja</th></tr></thead>
            <tbody>{data.activeShipments.map((row) => <tr key={row.id}><td><Link className="text-brand-700 hover:underline" href={"/__console/orders/" + row.order_id}>#{row.order_id.slice(0, 8).toUpperCase()}</Link></td><td>{row.status}</td><td>{row.courier_id ? 'Biriktirilgan' : <span className="font-semibold text-amber-600">Kuryersiz</span>}</td><td className="text-xs text-ink-500">{row.planned_at ? new Date(row.planned_at).toLocaleString('uz-UZ') : '—'}</td></tr>)}</tbody>
          </table>
        </section>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        <section className="card p-4">
          <div className="flex items-center gap-2"><Database className="h-5 w-5 text-brand-600" /><h2 className="font-bold">Boshqaruv oynasi</h2></div>
          <p className="mt-2 text-sm text-ink-500">Bu modul real Supabase ko‘rsatkichlari bilan ishlaydi. Chuqur amallar tegishli sahifalarga olib boradi.</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/__console" className="rounded-2xl bg-slate-950 p-4 text-sm text-white"><Gauge className="mb-2 h-5 w-5 text-emerald-300" />Command Center</Link>
            <Link href="/__console/ai" className="rounded-2xl bg-brand-50 p-4 text-sm text-brand-800"><Bot className="mb-2 h-5 w-5" />AI Control</Link>
            <Link href="/__console/risk" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-800"><CircleAlert className="mb-2 h-5 w-5" />Risk Center</Link>
            <Link href="/__console/security" className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-800"><ShieldCheck className="mb-2 h-5 w-5" />Security</Link>
          </div>
        </section>

        <section className="card p-4">
          <h2 className="font-bold">Jonli signallar</h2>
          <div className="mt-3 space-y-2">
            {warnings.length === 0
              ? <div className="flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700"><CircleCheck className="h-4 w-4" />Kritik signal yo‘q.</div>
              : warnings.map((w) => <div key={w.title} className={w.danger ? 'rounded-xl bg-red-50 p-3 text-sm text-red-700' : 'rounded-xl bg-amber-50 p-3 text-sm text-amber-700'}><strong className="block">{w.title}</strong>{w.body}</div>)}
          </div>
        </section>
      </div>
    </div>
  );
}
