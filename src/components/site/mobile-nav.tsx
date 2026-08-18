import Link from 'next/link';
import { Home, LayoutGrid, LifeBuoy, ShoppingCart, User } from 'lucide-react';

const ITEMS = [
  { href: '/', label: 'Asosiy', icon: Home },
  { href: '/catalog', label: 'Katalog', icon: LayoutGrid },
  { href: '/cart', label: 'Savat', icon: ShoppingCart },
  { href: '/support', label: 'Yordam', icon: LifeBuoy },
  { href: '/profile', label: 'Profil', icon: User },
];

export function MobileNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur sm:hidden">
      <ul className="grid grid-cols-5">
        {ITEMS.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link href={href} className="flex flex-col items-center gap-0.5 py-2 text-[11px] text-ink-500">
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
