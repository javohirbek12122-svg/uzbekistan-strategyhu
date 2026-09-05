import { getConsoleIdentity } from '@/lib/security/console';
import { ConsoleShell } from '@/components/console/shell';
import { getAnalyticsOverview, getRevenueChart, getOrdersByStatus } from '@/server/console/analytics';
import AnalyticsClient from './analytics-client';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const identity = await getConsoleIdentity();
  if (!identity) return null;

  const [overview, revenue, statuses] = await Promise.all([
    getAnalyticsOverview(),
    getRevenueChart(14),
    getOrdersByStatus(),
  ]);

  return (
    <ConsoleShell identity={identity}>
      <div className="space-y-6">
        <h1 className="text-xl font-bold">Analitika va monitoring</h1>
        <AnalyticsClient overview={overview} revenue={revenue} statuses={statuses} />
      </div>
    </ConsoleShell>
  );
}
