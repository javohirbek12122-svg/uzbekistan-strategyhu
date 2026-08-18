import Link from 'next/link';
import type { Metadata } from 'next';
import { getMyNotifications } from '@/server/queries';
import { dateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Bildirishnomalar' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-xl font-bold">Bildirishnomalar</h1>
      {notifications.length === 0 ? (
        <p className="card p-6 text-sm text-ink-500">Bildirishnoma yo&apos;q.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id} className="card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{notification.title}</p>
                  {notification.body && <p className="text-sm text-ink-500">{notification.body}</p>}
                </div>
                <span className="shrink-0 text-xs text-ink-500">{dateTime(notification.created_at)}</span>
              </div>
              {notification.link && (
                <Link href={notification.link} className="mt-2 inline-block text-sm text-brand-600 hover:underline">
                  Batafsil
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
