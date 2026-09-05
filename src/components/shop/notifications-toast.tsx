'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CircleHelp } from 'lucide-react';
import { dateTime } from '@/lib/format';

export function NotificationsToast() {
  const [items, setItems] = useState<
    { id: string; title: string; body: string | null; link: string | null; created_at: string; read_at: string | null }[]
  >([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setItems(data.notifications ?? []);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const unread = items.filter((n) => !n.read_at).length;

  return (
    <div className="fixed right-4 top-4 z-[9999] w-80">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full border border-white/10 bg-white/5 p-2 text-slate-300 backdrop-blur-md transition hover:text-white"
        aria-label="Bildirishnomalar"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="mt-2 max-h-96 space-y-2 overflow-y-auto rounded-2xl border border-white/10 bg-slate-900/95 p-3 shadow-2xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Bildirishnomalar</p>
            <Link href="/notifications" className="text-xs text-brand-400 hover:underline">
              Barchasi
            </Link>
          </div>
          {items.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400">Bildirishnoma yo‘q.</p>
          )}
          {items.map((n) => (
            <div
              key={n.id}
              className={`rounded-xl border p-3 text-xs transition ${
                n.read_at ? 'border-white/5 bg-white/5 text-slate-300' : 'border-brand-500/40 bg-brand-500/10 text-white'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium">{n.title}</p>
                {!n.read_at && <Check className="h-3 w-3 text-emerald-400" />}
              </div>
              {n.body && <p className="mt-1 text-[11px] text-slate-300">{n.body}</p>}
              <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                <CircleHelp className="h-3 w-3" />
                {dateTime(n.created_at)}
              </div>
              {n.link && (
                <Link href={n.link} className="mt-2 inline-block text-[11px] text-brand-400 hover:underline">
                  Batafsil
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
