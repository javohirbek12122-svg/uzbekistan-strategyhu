import { Check } from 'lucide-react';
import { ORDER_STATUS_LABEL, TRACKING_STEPS } from '@/lib/orders';
import { cn, dateTime } from '@/lib/format';
import type { OrderStatus, OrderStatusHistoryRow } from '@/lib/types';

export function OrderTimeline({
  status,
  history,
}: {
  status: OrderStatus;
  history: OrderStatusHistoryRow[];
}) {
  const reached = new Set(history.map((row) => row.to_status));
  const cancelled = status === 'cancelled' || status === 'returned' || status === 'refunded';
  const currentIndex = TRACKING_STEPS.indexOf(status);

  return (
    <div className="space-y-4">
      {cancelled ? (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          Buyurtma holati: {ORDER_STATUS_LABEL[status]}
        </p>
      ) : (
        <ol className="grid gap-3 sm:grid-cols-6">
          {TRACKING_STEPS.map((step, index) => {
            const done = reached.has(step) || (currentIndex >= 0 && index <= currentIndex);
            return (
              <li key={step} className="flex items-center gap-2 sm:flex-col sm:text-center">
                <span
                  className={cn(
                    'grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-semibold',
                    done ? 'border-brand-500 bg-brand-500 text-white' : 'border-slate-300 bg-white text-slate-400',
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : index + 1}
                </span>
                <span className={cn('text-xs', done ? 'font-medium text-ink-900' : 'text-ink-500')}>
                  {ORDER_STATUS_LABEL[step]}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {history.length > 0 && (
        <ul className="space-y-2 border-t border-slate-100 pt-3 text-sm">
          {history.map((row) => (
            <li key={row.id} className="flex items-start justify-between gap-3">
              <span>
                {ORDER_STATUS_LABEL[row.to_status]}
                {row.comment && <span className="block text-xs text-ink-500">{row.comment}</span>}
              </span>
              <span className="shrink-0 text-xs text-ink-500">{dateTime(row.created_at)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
