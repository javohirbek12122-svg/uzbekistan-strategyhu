import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const uzs = new Intl.NumberFormat('uz-UZ', { maximumFractionDigits: 0 });

export function money(amount: number): string {
  return `${uzs.format(Math.round(amount))} so'm`;
}

export function moneyShort(amount: number): string {
  return uzs.format(Math.round(amount));
}

export function discountPercent(price: number, compareAt: number | null): number | null {
  if (!compareAt || compareAt <= price) return null;
  return Math.round(((compareAt - price) / compareAt) * 100);
}

export function dateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';
  return new Date(value).toLocaleString('uz-UZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function relativeHours(value: string | Date | null | undefined): string {
  if (!value) return '—';
  const diff = new Date(value).getTime() - Date.now();
  const hours = Math.round(diff / 3_600_000);
  if (hours === 0) return 'hozir';
  if (hours > 0) return `${hours} soatdan keyin`;
  return `${Math.abs(hours)} soat oldin`;
}
