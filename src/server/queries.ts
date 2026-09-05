import 'server-only';
import { unstable_cache } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { publicClient } from '@/lib/supabase/public';
import { isSupabaseConfigured } from '@/lib/env';
import type { Address, Banner, Category, DeliveryZone, Order, Product, Ticket } from '@/lib/types';

const PRODUCT_SELECT =
  'id, slug, sku, name_uz, name_ru, description_uz, price, compare_at_price, weight_gram, stock, reserved, max_per_order, rating, reviews_count, sold_count, is_active, is_featured, created_at, category_id, brand_id, product_images(id, url, position, alt, product_id), categories(id, slug, name_uz)';

/**
 * Storefront reads degrade to empty results, so a failed query would otherwise
 * be invisible; every read reports its Postgres/RLS error to the server log.
 */
function pick<T>(label: string, result: { data: T; error: { message: string } | null }): T {
  if (result.error) console.error(`[queries:${label}] ${result.error.message}`);
  return result.data;
}

export interface CatalogFilters {
  category?: string;
  q?: string;
  min?: number;
  max?: number;
  sort?: 'new' | 'cheap' | 'expensive' | 'popular' | 'rating';
  page?: number;
}

export const CATALOG_PAGE_SIZE = 24;

/** Revalidation tag for every cached public catalog read. */
export const CATALOG_TAG = 'catalog';
const CATALOG_TTL_SECONDS = 60;

/**
 * Public catalog reads are identical for all visitors, so they are served from
 * the data cache instead of hitting Postgres once per request. The console
 * revalidates `CATALOG_TAG` whenever it changes catalog data.
 */
function cachedRead<A extends unknown[], R>(key: string, fn: (...args: A) => Promise<R>) {
  return unstable_cache(fn, ['catalog', key], { revalidate: CATALOG_TTL_SECONDS, tags: [CATALOG_TAG] });
}

export const getCategories = cachedRead('categories', async (): Promise<Category[]> => {
  if (!isSupabaseConfigured) return [];
  const data = pick(
    'categories',
    await publicClient().from('categories').select('*').eq('is_active', true).order('position', { ascending: true }),
  );
  return (data ?? []) as Category[];
});

export const getBanners = cachedRead('banners', async (): Promise<Banner[]> => {
  if (!isSupabaseConfigured) return [];
  const data = pick(
    'banners',
    await publicClient().from('banners').select('*').eq('is_active', true).order('position', { ascending: true }),
  );
  return (data ?? []) as Banner[];
});

export const getFeaturedProducts = cachedRead('featured', async (limit: number = 12): Promise<Product[]> => {
  if (!isSupabaseConfigured) return [];
  const data = pick(
    'featured-products',
    await publicClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
  return (data ?? []) as unknown as Product[];
});

export const getNewProducts = cachedRead('new', async (limit: number = 12): Promise<Product[]> => {
  if (!isSupabaseConfigured) return [];
  const data = pick(
    'new-products',
    await publicClient()
      .from('products')
      .select(PRODUCT_SELECT)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit),
  );
  return (data ?? []) as unknown as Product[];
});

export const getCatalog = cachedRead('list', async (filters: CatalogFilters): Promise<{ products: Product[]; total: number }> => {
  if (!isSupabaseConfigured) return { products: [], total: 0 };
  const supabase = publicClient();
  const page = Math.max(1, filters.page ?? 1);
  const from = (page - 1) * CATALOG_PAGE_SIZE;

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT, { count: 'exact' })
    .eq('is_active', true)
    .range(from, from + CATALOG_PAGE_SIZE - 1);

  if (filters.category) {
    const category = pick(
      'catalog-category',
      await supabase.from('categories').select('id').eq('slug', filters.category).maybeSingle(),
    );
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

  const result = await query;
  const data = pick('catalog', result);
  return { products: (data ?? []) as unknown as Product[], total: result.count ?? 0 };
});

export const getProductBySlug = cachedRead('product', async (slug: string): Promise<Product | null> => {
  if (!isSupabaseConfigured) return null;
  const data = pick(
    'product',
    await publicClient().from('products').select(PRODUCT_SELECT).eq('slug', slug).maybeSingle(),
  );
  return (data as unknown as Product) ?? null;
});

export const getProductReviews = cachedRead('reviews', async (productId: string) => {
  if (!isSupabaseConfigured) return [];
  const data = pick(
    'product-reviews',
    await publicClient()
      .from('reviews')
      .select('id, rating, body, created_at, user_id')
      .eq('product_id', productId)
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(20),
  );
  return data ?? [];
});

export const getZones = cachedRead('zones', async (): Promise<DeliveryZone[]> => {
  if (!isSupabaseConfigured) return [];
  const data = pick(
    'delivery-zones',
    await publicClient()
      .from('delivery_zones')
      .select('*')
      .eq('is_active', true)
      .order('position', { ascending: true }),
  );
  return (data ?? []) as DeliveryZone[];
});

export async function getCart() {
  if (!isSupabaseConfigured) return { items: [], itemsTotal: 0, weightGram: 0, count: 0 };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], itemsTotal: 0, weightGram: 0, count: 0 };

  const data = pick(
    'cart',
    await supabase
      .from('cart_items')
      .select(`id, cart_id, product_id, quantity, products(${PRODUCT_SELECT})`)
      .order('created_at', { ascending: true }),
  );

  const items = (data ?? []) as unknown as { id: string; product_id: string; quantity: number; products: Product }[];
  const itemsTotal = items.reduce((sum, item) => sum + (item.products?.price ?? 0) * item.quantity, 0);
  const weightGram = items.reduce((sum, item) => sum + (item.products?.weight_gram ?? 0) * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  return { items, itemsTotal, weightGram, count };
}

export async function getAddresses(): Promise<Address[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const data = pick(
    'addresses',
    await supabase
      .from('addresses')
      .select('*, delivery_zones(id, name_uz, slug)')
      .order('is_default', { ascending: false }),
  );
  return (data ?? []) as unknown as Address[];
}

export async function getMyOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const data = pick(
    'my-orders',
    await supabase
      .from('orders')
      .select('*, order_items(*), shipments(*)')
      .order('created_at', { ascending: false }),
  );
  return (data ?? []) as unknown as Order[];
}

export async function getOrder(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured) return null;
  const supabase = await createClient();
  const data = pick(
    'order',
    await supabase.from('orders').select('*, order_items(*), shipments(*)').eq('id', id).maybeSingle(),
  );
  return (data as unknown as Order) ?? null;
}

export async function getOrderHistory(id: string) {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const data = pick(
    'order-history',
    await supabase
      .from('order_status_history')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true }),
  );
  return data ?? [];
}

export async function getMyTickets(): Promise<Ticket[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const data = pick(
    'my-tickets',
    await supabase.from('tickets').select('*, ticket_messages(*)').order('created_at', { ascending: false }),
  );
  return (data ?? []) as unknown as Ticket[];
}

export async function getMyNotifications() {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const data = pick(
    'notifications',
    await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20),
  );
  return data ?? [];
}

export async function getTodayOrders() {
  if (!isSupabaseConfigured) return [];
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data, error } = await supabase
    .from('orders')
    .select('id, address_snapshot, order_items(name_snapshot, quantity, weight_gram), payment_provider, created_at')
    .gte('created_at', today.toISOString())
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[queries:today-orders]', error.message);
    return [];
  }

  return data ?? [];
}

/** Rendered in the shared layout, so it must never cost a query per request. */
export const getStoreSettings = cachedRead(
  'store-settings',
  async (): Promise<{ name: string; phone: string; telegram: string; address: string }> => {
    const fallback = {
      name: 'Parkent E-Mart',
      phone: '+998 90 000 00 00',
      telegram: 'https://t.me/parkent_emart',
      address: 'Parkent tumani, Toshkent viloyati',
    };
    if (!isSupabaseConfigured) return fallback;
    const data = pick(
      'store-settings',
      await publicClient().from('settings').select('value').eq('key', 'store').maybeSingle(),
    );
    return { ...fallback, ...((data?.value as Record<string, string>) ?? {}) };
  },
);
