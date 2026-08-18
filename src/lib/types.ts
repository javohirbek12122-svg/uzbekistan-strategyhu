export type AppRole = 'customer' | 'courier' | 'manager' | 'admin';

export type OrderStatus =
  | 'created'
  | 'pending_payment'
  | 'paid'
  | 'confirmed'
  | 'packing'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'returned'
  | 'refunded';

export type PaymentProvider = 'payme' | 'click' | 'cash';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'cancelled' | 'refunded' | 'failed';

export type ShipmentStatus = 'pending' | 'assigned' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';

export type TicketKind = 'complaint' | 'suggestion' | 'question' | 'return_request';
export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Category {
  id: string;
  parent_id: string | null;
  slug: string;
  name_uz: string;
  name_ru: string | null;
  icon: string | null;
  image_url: string | null;
  position: number;
  is_active: boolean;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  category_id: string | null;
  brand_id: string | null;
  name_uz: string;
  name_ru: string | null;
  description_uz: string | null;
  description_ru: string | null;
  price: number;
  compare_at_price: number | null;
  weight_gram: number;
  volume_cm3: number;
  stock: number;
  reserved: number;
  max_per_order: number;
  rating: number;
  reviews_count: number;
  sold_count: number;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  product_images?: ProductImage[];
  categories?: Pick<Category, 'id' | 'slug' | 'name_uz'> | null;
}

export interface DeliveryZone {
  id: string;
  slug: string;
  name_uz: string;
  base_fee: number;
  max_fee: number;
  fee_per_kg: number;
  free_over_total: number | null;
  min_hours: number;
  max_hours: number;
  sla_hours: number;
  center_lat: number | null;
  center_lng: number | null;
  radius_km: number | null;
  is_active: boolean;
  position: number;
}

export interface Address {
  id: string;
  user_id: string;
  zone_id: string | null;
  label: string | null;
  recipient_name: string;
  phone: string;
  line1: string;
  landmark: string | null;
  lat: number | null;
  lng: number | null;
  is_default: boolean;
  delivery_zones?: Pick<DeliveryZone, 'id' | 'name_uz' | 'slug'> | null;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  quantity: number;
  products?: Product;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  name_snapshot: string;
  sku_snapshot: string;
  image_snapshot: string | null;
  unit_price: number;
  quantity: number;
  weight_gram: number;
  line_total: number;
}

export interface AddressSnapshot {
  recipient_name?: string;
  phone?: string;
  line1?: string;
  landmark?: string | null;
  lat?: number | null;
  lng?: number | null;
  zone?: string;
}

export interface Order {
  id: string;
  order_number: string;
  user_id: string;
  status: OrderStatus;
  zone_id: string | null;
  address_id: string | null;
  address_snapshot: AddressSnapshot;
  items_total: number;
  delivery_fee: number;
  discount_total: number;
  compensation_total: number;
  total: number;
  promo_code: string | null;
  total_weight_gram: number;
  payment_provider: PaymentProvider;
  payment_status: PaymentStatus;
  customer_note: string | null;
  promised_at: string | null;
  delivered_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  order_items?: OrderItem[];
  shipments?: Shipment[] | Shipment | null;
  profiles?: { full_name: string | null; phone: string | null; email: string | null } | null;
}

export interface Shipment {
  id: string;
  order_id: string;
  courier_id: string | null;
  status: ShipmentStatus;
  planned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
  proof_code: string | null;
  route_position: number | null;
  notes: string | null;
}

export interface OrderStatusHistoryRow {
  id: number;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  comment: string | null;
  created_at: string;
}

export interface Ticket {
  id: string;
  user_id: string;
  order_id: string | null;
  kind: TicketKind;
  subject: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  ticket_messages?: TicketMessage[];
  profiles?: { full_name: string | null; email: string | null } | null;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  author_id: string | null;
  is_staff: boolean;
  body: string;
  created_at: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link: string | null;
  position: number;
  is_active: boolean;
}

export interface AuditLogRow {
  id: number;
  actor_email: string | null;
  action: string;
  entity: string | null;
  entity_id: string | null;
  before: unknown;
  after: unknown;
  ip: string | null;
  created_at: string;
}
