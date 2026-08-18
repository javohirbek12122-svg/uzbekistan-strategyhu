import type { DeliveryZone } from './types';

/** Weight included in the base delivery fee. Mirrors `public.calc_delivery_fee`. */
export const BASE_WEIGHT_GRAM = 5000;

export interface FeeInput {
  zone: Pick<DeliveryZone, 'base_fee' | 'max_fee' | 'fee_per_kg' | 'free_over_total'>;
  weightGram: number;
  itemsTotal: number;
}

/**
 * Delivery fee preview for the storefront. The authoritative value is always
 * recomputed by the database when the order is created.
 */
export function calcDeliveryFee({ zone, weightGram, itemsTotal }: FeeInput): number {
  if (zone.free_over_total !== null && itemsTotal >= zone.free_over_total) return 0;
  const extraKg = Math.max(0, Math.ceil((Math.max(weightGram, 0) - BASE_WEIGHT_GRAM) / 1000));
  return Math.min(zone.base_fee + extraKg * zone.fee_per_kg, zone.max_fee);
}

export function formatEta(zone: Pick<DeliveryZone, 'min_hours' | 'max_hours'>): string {
  const part = (hours: number) => {
    if (hours < 24) return `${hours} soat`;
    const days = Math.round(hours / 24);
    return `${days} kun`;
  };
  return zone.min_hours === zone.max_hours
    ? part(zone.max_hours)
    : `${part(zone.min_hours)} — ${part(zone.max_hours)}`;
}

const EARTH_RADIUS_KM = 6371;

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

/** Nearest active zone whose radius contains the pinned point. */
export function resolveZoneByPoint(zones: DeliveryZone[], point: { lat: number; lng: number }): DeliveryZone | null {
  const candidates = zones
    .filter((z) => z.is_active && z.center_lat !== null && z.center_lng !== null)
    .map((z) => ({
      zone: z,
      distance: distanceKm(point, { lat: z.center_lat as number, lng: z.center_lng as number }),
    }))
    .sort((a, b) => a.distance - b.distance);

  const inside = candidates.find((c) => c.distance <= (c.zone.radius_km ?? 0));
  return inside?.zone ?? null;
}
