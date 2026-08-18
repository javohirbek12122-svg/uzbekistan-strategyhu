import Link from 'next/link';
import { AlertTriangle, Clock, LifeBuoy, Package, ShoppingBag, TrendingUp, Users, Wallet } from 'lucide-react';
import { dashboardStats } from '@/server/console/db-explorer';
import { consoleOrders } from '@/server/console/queries';
import { OrderStatusBadge, PaymentBadge } from '@/components/ui/badges';
import { dateTime, money } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function ConsoleDashboard() {
  const [stats, { orders }] = await Promise.all([dashboardStats(), consoleOrders('', '', 1)]);
  const latest = orders.slice(0, 10);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Boshqaruv paneli</h1>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat icon={Wallet} label="Tushum (to'langan)" value={money(stats.revenue)} />
        <Stat icon={TrendingUp} label="O'rtacha buyurtma" value={money(stats.averageOrder)} />
        <Stat icon={ShoppingBag} label="Bugungi buyurtmalar" value={String(stats.ordersToday)} />
        <Stat icon={ShoppingBag} label="Jami buyurtmalar" value={String(stats.ordersTotal)} />
        <Stat icon={Clock} label="Jarayonda" value={String(stats.pendingOrders)} href="/__console/orders" />
        <Stat icon={AlertTriangle} label="Kechikkan" value={String(stats.lateOrders)} href="/__console/delivery" tone="danger" />
        <Stat icon={LifeBuoy} label="Ochiq murojaat" value={String(stats.openTickets)} href="/__console/tickets" />
        <Stat icon={Package} label="Ombor kam (<5)" value={String(stats.lowStock)} href="/__console/products" tone="warn" />
        <Stat icon={Users} label="Foydalanuvchilar" value={String(stats.customers)} href="/__console/users" />
      </div>

      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="font-semibold">Oxirgi buyurtmalar</h2>
          <Link href="/__console/orders" className="text-sm text-brand-600 hover:underline">
            Barchasi
          </Link>
        </div>
        <table className="table-base">
          <thead>
            <tr>
              <th>Raqam</th>
              <th>Xaridor</th>
              <th>Holat</th>
              <th>To&apos;lov</th>
              <th>Summa</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {latest.map((order) => (
              <tr key={order.id}>
                <td>
                  <Link href={`/__console/orders/${order.id}`} className="font-medium text-brand-700 hover:underline">
                    #{order.order_number}
                  </Link>
                </td>
                <td>
                  {order.profiles?.full_name ?? '—'}
                  <span className="block text-xs text-ink-500">{order.address_snapshot?.phone}</span>
                </td>
                <td><OrderStatusBadge status={order.status} /></td>
                <td><PaymentBadge status={order.payment_status} /></td>
                <td className="font-medium">{money(order.total)}</td>
                <td className="text-xs text-ink-500">{dateTime(order.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  href,
  tone,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  href?: string;
  tone?: 'danger' | 'warn';
}) {
  const body = (
    <div className="card flex items-center gap-3 p-4">
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
          tone === 'danger'
            ? 'bg-red-50 text-red-600'
            : tone === 'warn'
              ? 'bg-amber-50 text-amber-600'
              : 'bg-brand-50 text-brand-600'
        }`}
      >
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs text-ink-500">{label}</p>
        <p className="truncate text-lg font-bold">{value}</p>
      </div>
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}
