import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import type { Address, Banner, Category, DeliveryZone, Order, Product, Ticket } from '@/lib/types';

const PRODUCT_SELECT =
  'id, slug, sku, name_uz, name_ru, description_uz, price, compare_at_price, weight_gram, stock, reserved, max_per_order, rating, reviews_count, sold_count, is_active, is_featured, created_at, category_id, brand_id, product_images(id, url, position, alt, product_id), categories(id, slug, name_uz)';

export interface CatalogFilters {
  category?: string;
  q?: string;
  min?: number;
  max?: number;
  sort?: 'new' | 'cheap' | 'expensive' | 'popular' | 'rating';
  page?: number;
}

export const CATALOG_PAGE_SIZE = 24;

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });
  return (data ?? []) as Category[];
}

export async function getBanners(): Promise<Banner[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('banners')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });
  return (data ?? []) as Banner[];
}

export async function getFeaturedProducts(limit = 12): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Product[];
}

export async function getNewProducts(limit = 12): Promise<Product[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('products')
    .select(PRODUCT_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as Product[];
}

export async function getCatalog(filters: CatalogFilters): Promise<{ products: Product[]; total: number }> {
  if (!isSupabaseConfigured) return { products: [], total: 0 };
  const supabase = await createClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CATALOG_PAGE_SIZE;

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .range(from, from + CATALOG_PAGE_SIZE - 1);

  if (filters.category) {
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('slug', filters.category)
      .maybeSingle();
    if (category) query = query.eq('category_id', category.id);
  }
  if (filters.q) {
    const term = filters.q.replace(/[%,()]/g, ' ').trim();
    if (term) query = query.or(`name_uz.ilike.%${term}%,name_ru.ilike.%${term}%,sku.ilike.%${term}%`);
  }
  if (filters.min !== undefined) query = query.gte('price', filters.min);
  if (filters.max !== undefined) query = query.lte('price', filters.max);

  switch (filters.sort) {
    case 'cheap':
      query = query.order('price', { ascending: true });
      break;
    case 'expensive':
      query = query.order('price', { ascending: false });
      break;
    case 'popular':
      query = query.order('sold_count', { ascending: false });
      break;
    case 'rating':
      query = query.order('rating', { ascending: false });
      break;
    default:
      query = query.order('created_at', { ascending: false });
  }

  const { data, count } = await query;
  return { products: (data ?? []) as unknown as Product[], total: count ?? 0 };
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle();
  return (data as unknown as Product) ?? null;
}

export async function getProductReviews(productId: string) {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('reviews')
    .select('id, rating, body, created_at, user_id')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getZones(): Promise<DeliveryZone[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('delivery_zones')
    .select('*')
    .eq('is_active', true)
    .order('position', { ascending: true });
  return (data ?? []) as DeliveryZone[];
}

export async function getCart() {
  if (!isSupabaseConfigured) return { items: [], itemsTotal: 0, weightGram: 0, count: 0 };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], itemsTotal: 0, weightGram: 0, count: 0 };

  const { data } = await supabase
    .from('cart_items')
    .select(`id, cart_id, product_id, quantity, products(${PRODUCT_SELECT})`)
    .order('created_at', { ascending: true });

  const items = (data ?? []) as unknown as { id: string; product_id: string; quantity: number; products: Product }[];
  const itemsTotal = items.reduce((sum, item) => sum + (item.products?.price ?? 0) * item.quantity, 0);
  const weightGram = items.reduce((sum, item) => sum + (item.products?.weight_gram ?? 0) * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, itemsTotal, weightGram, count };
}

export async function getAddresses(): Promise<Address[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('addresses')
    .select('*, delivery_zones(id, name_uz, slug)')
    .order('is_default', { ascending: false });
  return (data ?? []) as unknown as Address[];
}

export async function getMyOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*), shipments(*)')
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Order[];
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from('orders')
    .select('*, order_items(*), shipments(*)')
    .eq('id', id)
    .maybeSingle();
  return (data as unknown as Order) ?? null;
}

export async function getOrderHistory(id: string) {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', id)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function getMyTickets(): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('tickets')
    .select('*, ticket_messages(*)')
    .order('created_at', { ascending: false });
  return (data ?? []) as unknown as Ticket[];
}

export async function getMyNotifications() {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(20);
  return data ?? [];
}

export async function getStoreSettings(): Promise<{ name: string; phone: string; telegram: string; address: string }> {
  const fallback = {
    name: 'Parkent E-Mart',
    phone: '+998 90 000 00 00',
    telegram: 'https://t.me/parkent_emart',
    address: 'Parkent tumani, Toshkent viloyati',
  };
  if (!isSupabaseConfigured) return fallback;
  const supabase = await createClient();
  const { data } = await supabase.from('settings').select('value').eq('key', 'store').maybeSingle();
  return { ...fallback, ...((data?.value as Record<string, string>) ?? {}) };
}
