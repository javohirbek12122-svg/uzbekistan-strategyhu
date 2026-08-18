import { cn } from '@/lib/format';
import { ORDER_STATUS_LABEL } from '@/lib/orders';
import type { OrderStatus, PaymentStatus, ShipmentStatus, TicketStatus } from '@/lib/types';

const ORDER_TONE: Record<OrderStatus, string> = {
  created: 'bg-slate-100 text-slate-700',
  pending_payment: 'bg-amber-100 text-amber-800',
  paid: 'bg-brand-100 text-brand-700',
  confirmed: 'bg-brand-100 text-brand-700',
  packing: 'bg-sky-100 text-sky-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-brand-100 text-brand-700',
  completed: 'bg-brand-500 text-white',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-orange-100 text-orange-700',
  refunded: 'bg-violet-100 text-violet-700',
};

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  return <span className={cn('badge', ORDER_TONE[status], className)}>{ORDER_STATUS_LABEL[status]}</span>;
}

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  pending: "To'lov kutilmoqda",
  authorized: 'Bloklandi',
  paid: "To'landi",
  cancelled: 'Bekor qilindi',
  refunded: 'Qaytarildi',
  failed: 'Xatolik',
};

const PAYMENT_TONE: Record<PaymentStatus, string> = {
  pending: 'bg-amber-100 text-amber-800',
  authorized: 'bg-sky-100 text-sky-700',
  paid: 'bg-brand-100 text-brand-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-violet-100 text-violet-700',
  failed: 'bg-red-100 text-red-700',
};

export function PaymentBadge({ status }: { status: PaymentStatus }) {
  return <span className={cn('badge', PAYMENT_TONE[status])}>{PAYMENT_LABEL[status]}</span>;
}

const SHIPMENT_LABEL: Record<ShipmentStatus, string> = {
  pending: 'Kutilmoqda',
  assigned: 'Kuryer tayinlandi',
  picked_up: 'Olib ketildi',
  in_transit: "Yo'lda",
  delivered: 'Yetkazildi',
  failed: 'Yetkazilmadi',
};

export function ShipmentBadge({ status }: { status: ShipmentStatus }) {
  return <span className="badge bg-slate-100 text-slate-700">{SHIPMENT_LABEL[status]}</span>;
}

const TICKET_LABEL: Record<TicketStatus, string> = {
  open: 'Yangi',
  in_progress: 'Ko\u2019rilmoqda',
  resolved: 'Hal qilindi',
  closed: 'Yopilgan',
};

const TICKET_TONE: Record<TicketStatus, string> = {
  open: 'bg-amber-100 text-amber-800',
  in_progress: 'bg-sky-100 text-sky-700',
  resolved: 'bg-brand-100 text-brand-700',
  closed: 'bg-slate-100 text-slate-600',
};

export function TicketBadge({ status }: { status: TicketStatus }) {
  return <span className={cn('badge', TICKET_TONE[status])}>{TICKET_LABEL[status]}</span>;
}
