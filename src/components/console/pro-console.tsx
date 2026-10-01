import Link from 'next/link';
import {
  Activity,
  ArrowUpRight,
  Box,
  Bot,
  CircleDollarSign,
  Gauge,
  Headphones,
  Megaphone,
  Package,
  RefreshCw,
  ShieldAlert,
  ShoppingBag,
  Sparkles,
  Truck,
  Users,
  Wallet,
} from 'lucide-react';
import { controlSnapshot } from '@/server/console/control';
import { dateTime, money } from '@/lib/format';

export async function ProCommandCenter() {
  const data = await controlSnapshot();

  const metrics = [
    ['Bugungi buyurtmalar', String(data.ordersToday), ShoppingBag, '/__console/orders'],
    ['30 kunlik tushum', money(data.revenue30d), CircleDollarSign, '/__console/analytics'],
    ['Faol mahsulotlar', String(data.activeProducts), Package, '/__console/products'],
    ['Mijozlar', String(data.customers), Users, '/__console/customers'],
    ['Past zaxira', String(data.lowStock), Box, '/__console/inventory'],
    ['Kechikayotgan yetkazish', String(data.lateShipments), Truck, '/__console/delivery'],
    ['Ochiq murojaatlar', String(data.openTickets), Headphones, '/__console/tickets'],
    ['Failed payment / 24h', String(data.failedPayments24h), ShieldAlert, '/__console/finance'],
  ] as const;

  const alerts = [
    data.lateShipments > 0 ? ['Yetkazish kechikishi', data.lateShipments + ' ta shipment rejalashtirilgan vaqtni oshirgan.', '/__console/delivery', Truck] : null,
    data.unassignedShipments > 0 ? ['Kuryer taqsimoti', data.unassignedShipments + ' ta shipment kuryersiz.', '/__console/couriers', Users] : null,
    data.outOfStock > 0 ? ['Mahsulot tugagan', data.outOfStock + ' ta faol mahsulotda 0 zaxira.', '/__console/inventory', Box] : null,
    data.pendingReviews > 0 ? ['Moderatsiya', data.pendingReviews + ' ta sharh ko‘rib chiqilmagan.', '/__console/reviews', Sparkles] : null,
    data.failedPayments24h > 0 ? ['To‘lovlar', data.failedPayments24h + ' ta failed payment / 24 soat.', '/__console/finance', Wallet] : null,
  ].filter(Boolean) as Array<[string,string,string,typeof Truck]>;

  const quick = [
    ['Mahsulot qo‘shish', '/__console/products/new', Package],
    ['Buyurtmalar', '/__console/orders', ShoppingBag],
    ['Marketing', '/__console/marketing', Megaphone],
    ['AI Control', '/__console/ai', Bot],
    ['Risk Center', '/__console/risk', ShieldAlert],
    ['Audit', '/__console/activity', Activity],
  ] as const;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
            <Gauge className="h-3.5 w-3.5" /> COMMAND CENTER
          </div>
          <h1 className="text-2xl font-black tracking-tight">Parkent E‑MART boshqaruv markazi</h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-300">Savdo, logistika, mijozlar, moliya, xavfsizlik va AI nazorati yagona operatsion qatlamda.</p>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {quick.map(([label, href, Icon]) => (
              <Link key={href} href={href} className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3 text-xs transition hover:bg-white/10">
                <Icon className="mb-2 h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(([label, value, Icon, href]) => (
          <Link key={label} href={href} className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-xs text-ink-500">{label}</p>
                <p className="truncate text-lg font-extrabold">{value}</p>
              </div>
            </div>
            <ArrowUpRight className="mt-3 h-4 w-4 text-ink-300 group-hover:text-brand-600" />
          </Link>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
        <section className="card p-4">
          <div className="flex items-center justify-between">
            <div><h2 className="font-bold">Operatsion signallar</h2><p className="text-xs text-ink-500">Tizim hozir ko‘rayotgan muhim holatlar</p></div>
            <RefreshCw className="h-4 w-4 text-ink-400" />
          </div>
          <div className="mt-4 space-y-2">
            {alerts.length === 0 && <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-700">Kritik signal yo‘q.</div>}
            {alerts.map(([title, body, href, Icon]) => (
              <Link key={title} href={href} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-3 hover:bg-slate-50">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600"><Icon className="h-4 w-4" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">{title}</strong><span className="text-xs text-ink-500">{body}</span></span>
                <ArrowUpRight className="h-4 w-4 text-ink-300" />
              </Link>
            ))}
          </div>
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between"><h2 className="font-bold">AI operatsion rejimi</h2><Bot className="h-5 w-5 text-brand-600" /></div>
          <div className="mt-4 rounded-2xl bg-slate-950 p-4 text-white">
            <div className="flex items-center justify-between"><span className="text-xs text-slate-400">Mode</span><strong className="uppercase">{data.ai.mode}</strong></div>
            <div className="mt-3 space-y-2 text-xs text-slate-300">
              <div>Monitoring: {data.ai.auto_monitoring ? 'ON' : 'OFF'}</div>
              <div>Bildirishnoma: {data.ai.auto_notifications ? 'ON' : 'OFF'}</div>
              <div>O‘zgarishlar uchun tasdiq: {data.ai.require_approval_for_mutations ? 'ON' : 'OFF'}</div>
              <div>Kunlik digest: {data.ai.daily_digest ? 'ON' : 'OFF'}</div>
            </div>
            <Link href="/__console/ai" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-300">AI boshqaruvini ochish <ArrowUpRight className="h-3 w-3" /></Link>
          </div>
        </section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="card overflow-x-auto">
          <div className="flex items-center justify-between px-4 py-3"><h2 className="font-bold">Top mahsulotlar</h2><Link href="/__console/inventory" className="text-xs text-brand-600">Inventar</Link></div>
          <table className="table-base">
            <thead><tr><th>Mahsulot</th><th>Sotilgan</th><th>Zaxira</th><th>Narx</th></tr></thead>
            <tbody>
              {data.topProducts.map((p) => <tr key={p.id}><td>{p.name_uz}</td><td>{p.sold_count}</td><td>{p.stock}</td><td>{money(p.price)}</td></tr>)}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-bold">So‘nggi audit</h2></div>
          <div className="divide-y divide-slate-100">
            {data.latestAudits.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0"><code className="text-xs font-semibold">{row.action}</code><div className="truncate text-xs text-ink-500">{row.actor_email ?? 'system'} · {row.entity ?? '—'}</div></div>
                <span className="shrink-0 text-[11px] text-ink-500">{dateTime(row.created_at)}</span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
