import {
  Baby,
  CupSoda,
  House,
  Plug,
  ShoppingBasket,
  Sparkles,
  Wheat,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  Baby,
  CupSoda,
  House,
  Plug,
  ShoppingBasket,
  Sparkles,
  Wheat,
};

export function CategoryIcon({ name, className }: { name?: string | null; className?: string }) {
  const Icon = name ? ICONS[name] : undefined;
  if (!Icon) return <ShoppingBasket className={className} aria-hidden />;
  return <Icon className={className} aria-hidden />;
}
