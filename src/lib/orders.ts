import type { OrderStatus } from './types';

/** Mirrors the `guard_order_status` trigger. */
export const ORDER_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  created: ['pending_payment', 'paid', 'confirmed', 'cancelled'],
  pending_payment: ['paid', 'cancelled'],
  paid: ['confirmed', 'cancelled', 'refunded'],
  confirmed: ['packing', 'cancelled'],
  packing: ['shipped', 'cancelled'],
  shipped: ['delivered', 'returned'],
  delivered: ['completed', 'returned'],
  completed: ['returned'],
  cancelled: [],
  returned: ['refunded'],
  refunded: [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return ORDER_TRANSITIONS[from].includes(to);
}

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  created: 'Yaratildi',
  pending_payment: "To'lov kutilmoqda",
  paid: "To'landi",
  confirmed: 'Tasdiqlandi',
  packing: 'Qadoqlanmoqda',
  shipped: "Yo'lda",
  delivered: 'Yetkazildi',
  completed: 'Yakunlandi',
  cancelled: 'Bekor qilindi',
  returned: 'Qaytarildi',
  refunded: 'Pul qaytarildi',
};

/** Steps shown in the customer tracking timeline. */
export const TRACKING_STEPS: OrderStatus[] = [
  'created',
  'confirmed',
  'packing',
  'shipped',
  'delivered',
  'completed',
];

export function trackingProgress(status: OrderStatus): number {
  if (status === 'cancelled' || status === 'returned' || status === 'refunded') return 0;
  const normalized: OrderStatus = status === 'pending_payment' || status === 'paid' ? 'created' : status;
  const index = TRACKING_STEPS.indexOf(normalized);
  return index < 0 ? 0 : Math.round(((index + 1) / TRACKING_STEPS.length) * 100);
}

export const DEFAULT_LATE_COMPENSATION = 5000;

export interface SlaInput {
  promisedAt: string | Date | null;
  deliveredAt?: string | Date | null;
  now?: Date;
  compensationAmount?: number;
}

export interface SlaResult {
  isLate: boolean;
  hoursLate: number;
  compensation: number;
}

/**
 * Late-delivery penalty: once the promise time passes, the buyer is owed a
 * fixed compensation (5 000 UZS by default). Mirrors `apply_late_compensations`.
 */
export function evaluateSla({
  promisedAt,
  deliveredAt,
  now = new Date(),
  compensationAmount = DEFAULT_LATE_COMPENSATION,
}: SlaInput): SlaResult {
  if (!promisedAt) return { isLate: false, hoursLate: 0, compensation: 0 };
  const promised = new Date(promisedAt).getTime();
  const finished = deliveredAt ? new Date(deliveredAt).getTime() : now.getTime();
  if (finished <= promised) return { isLate: false, hoursLate: 0, compensation: 0 };
  const hoursLate = Math.ceil((finished - promised) / 3_600_000);
  return { isLate: true, hoursLate, compensation: compensationAmount };
}
