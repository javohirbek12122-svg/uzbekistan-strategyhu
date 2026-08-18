import { z } from 'zod';

const uzPhone = /^\+?998\d{9}$/;

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s()-]/g, ''))
  .refine((v) => uzPhone.test(v), { message: "Telefon raqami +998XXXXXXXXX ko'rinishida bo'lishi kerak" });

export const passwordSchema = z
  .string()
  .min(10, "Parol kamida 10 belgidan iborat bo'lishi kerak")
  .regex(/[a-z]/, 'Kichik harf bo\'lishi kerak')
  .regex(/[A-Z]/, 'Katta harf bo\'lishi kerak')
  .regex(/\d/, 'Raqam bo\'lishi kerak');

export const signUpSchema = z.object({
  full_name: z.string().trim().min(3, 'Ism kamida 3 belgi'),
  email: z.string().trim().email('Email xato'),
  phone: phoneSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: z.string().trim().email('Email xato'),
  password: z.string().min(1, 'Parol kiriting'),
});

export const consoleLoginSchema = z.object({
  email: z.string().trim().email('Email xato'),
  password: z.string().min(1, 'Parol kiriting'),
  token: z.string().trim().min(6, 'Tekshiruv kodi 6 raqam').max(11),
});

export const addressSchema = z.object({
  id: z.string().uuid().optional(),
  label: z.string().trim().max(40).optional(),
  recipient_name: z.string().trim().min(3, 'Qabul qiluvchi ismi'),
  phone: phoneSchema,
  line1: z.string().trim().min(5, "Manzilni to'liq kiriting"),
  landmark: z.string().trim().max(200).optional(),
  zone_id: z.string().uuid('Hududni tanlang'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  is_default: z.coerce.boolean().optional(),
});

export const cartItemSchema = z.object({
  product_id: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(100),
});

/**
 * Checkout input. Deliberately contains no money fields: totals are computed
 * by the database from the cart and the product table.
 */
export const checkoutSchema = z.object({
  address_id: z.string().uuid('Manzilni tanlang'),
  provider: z.enum(['payme', 'click', 'cash']),
  promo_code: z.string().trim().max(32).optional(),
  note: z.string().trim().max(500).optional(),
});

export const ticketSchema = z.object({
  kind: z.enum(['complaint', 'suggestion', 'question', 'return_request']),
  subject: z.string().trim().min(5, 'Mavzu kamida 5 belgi'),
  body: z.string().trim().min(10, 'Murojaat matni kamida 10 belgi'),
  order_id: z.string().uuid().optional(),
});

export const ticketReplySchema = z.object({
  ticket_id: z.string().uuid(),
  body: z.string().trim().min(1),
});

export const reviewSchema = z.object({
  product_id: z.string().uuid(),
  rating: z.coerce.number().int().min(1).max(5),
  body: z.string().trim().max(1000).optional(),
});

export const productSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Slug faqat kichik harf, raqam va chiziqcha'),
  sku: z.string().trim().min(2),
  name_uz: z.string().trim().min(2),
  name_ru: z.string().trim().optional(),
  description_uz: z.string().trim().max(4000).optional(),
  category_id: z.string().uuid().optional().or(z.literal('')),
  brand_id: z.string().uuid().optional().or(z.literal('')),
  price: z.coerce.number().int().min(0),
  compare_at_price: z.coerce.number().int().min(0).optional(),
  weight_gram: z.coerce.number().int().min(0),
  stock: z.coerce.number().int().min(0),
  max_per_order: z.coerce.number().int().min(1).max(1000),
  is_active: z.coerce.boolean().optional(),
  is_featured: z.coerce.boolean().optional(),
  image_url: z.string().trim().url().optional().or(z.literal('')),
});

export const zoneSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z.string().trim().min(2),
  name_uz: z.string().trim().min(2),
  base_fee: z.coerce.number().int().min(0),
  max_fee: z.coerce.number().int().min(0),
  fee_per_kg: z.coerce.number().int().min(0),
  min_hours: z.coerce.number().int().min(0).max(720),
  max_hours: z.coerce.number().int().min(1).max(720),
  sla_hours: z.coerce.number().int().min(1).max(720),
  center_lat: z.coerce.number().optional(),
  center_lng: z.coerce.number().optional(),
  radius_km: z.coerce.number().min(0).max(200).optional(),
  is_active: z.coerce.boolean().optional(),
});

export const orderStatusSchema = z.object({
  order_id: z.string().uuid(),
  status: z.enum([
    'created',
    'pending_payment',
    'paid',
    'confirmed',
    'packing',
    'shipped',
    'delivered',
    'completed',
    'cancelled',
    'returned',
    'refunded',
  ]),
  comment: z.string().trim().max(500).optional(),
});

export const roleSchema = z.object({
  user_id: z.string().uuid(),
  role: z.enum(['customer', 'courier', 'manager', 'admin']),
});

export const settingSchema = z.object({
  key: z.string().trim().min(2),
  value: z.string().trim().min(2),
});

export type FormState = { ok: boolean; message?: string; fieldErrors?: Record<string, string[]> } | null;

export const initialFormState: FormState = null;

export function zodToFormState(error: z.ZodError): FormState {
  return { ok: false, message: 'Ma\'lumotlarni tekshirib qayta yuboring', fieldErrors: error.flatten().fieldErrors as Record<string, string[]> };
}
