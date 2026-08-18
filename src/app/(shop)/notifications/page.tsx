import Link from 'next/link';
import type { Metadata } from 'next';
import { getMyNotifications } from '@/server/queries';
import { markNotificationsRead } from '@/server/actions/shop';
import { dateTime } from '@/lib/format';

export const metadata: Metadata = { title: 'Bildirishnomalar' };
export const dynamic = 'force-dynamic';

export default async function NotificationsPage() {
  const notifications = await getMyNotifications();
  const unread = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl font-bold">Bildirishnomalar</h1>
        {unread > 0 && (
          <form action={markNotificationsRead}>
            <button type="submit" className="btn-secondary text-sm">
              O&apos;qilgan deb belgilash ({unread})
            </button>
          </form>
        )}
      </div>
      {notifications.length === 0 ? (
        <p className="card p-6 text-sm text-ink-500">Bildirishnoma yo&apos;q.</p>
      ) : (
        <ul className="space-y-2">
          {notifications.map((notification) => (
            <li key={notification.id} className={`card p-4 ${notification.read_at ? '' : 'border-brand-200 bg-brand-50/40'}`}>
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
