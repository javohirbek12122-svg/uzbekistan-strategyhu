'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Grid3x3, Sparkles, MapPin, Briefcase, Wallet, User } from 'lucide-react';
import { useAppStore } from '@/store/app-store';
import { cn } from '@/lib/format';

const items = [
  { href: '/', label: 'Asosiy', icon: Home },
  { href: '/catalog', label: 'Katalog', icon: Grid3x3 },
  { href: '/sommelier', label: 'AI', icon: Sparkles },
  { href: '/tracking', label: 'Reyslar', icon: MapPin },
  { href: '/b2b', label: 'B2B', icon: Briefcase },
  { href: '/wallet', label: 'Hamyon', icon: Wallet },
  { href: '/profile', label: 'Profil', icon: User },
];

export function BottomNav() {
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const isOnline = useAppStore((s) => s.isOnline);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  if (pathname?.startsWith('/__console') || pathname?.startsWith('/auth')) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/20 bg-white/80 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden"
      aria-label="Asosiy navigatsiya"
    >
      {!isOnline && (
        <div className="bg-amber-500 px-2 py-0.5 text-center text-[10px] font-medium text-white">
          ⚠ Oflayn rejim — o&apos;zgarishlar saqlanmoqda
        </div>
      )}
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-1 py-1.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== '/' && pathname?.startsWith(item.href));
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  'flex flex-col items-center gap-0.5 rounded-lg px-1 py-1 text-[10px] font-medium transition-colors',
                  active ? 'text-brand-600' : 'text-slate-500'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'fill-brand-100')} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
