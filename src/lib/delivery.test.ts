import { describe, expect, it } from 'vitest';
import { BASE_WEIGHT_GRAM, calcDeliveryFee, distanceKm, formatEta, resolveZoneByPoint } from './delivery';
import type { DeliveryZone } from './types';

const zone = (overrides: Partial<DeliveryZone> = {}): DeliveryZone =>
  ({
    id: overrides.id ?? 'zone-1',
    slug: 'parkent-markaz',
    name_uz: 'Parkent markaz',
    name_ru: null,
    base_fee: 15000,
    max_fee: 25000,
    fee_per_kg: 2000,
    free_over_total: null,
    min_hours: 1,
    max_hours: 24,
    sla_hours: 24,
    center_lat: 41.29,
    center_lng: 69.68,
    radius_km: 5,
    position: 0,
    is_active: true,
    ...overrides,
  }) as DeliveryZone;

describe('calcDeliveryFee', () => {
  it('charges only the base fee inside the included weight', () => {
    expect(calcDeliveryFee({ zone: zone(), weightGram: BASE_WEIGHT_GRAM, itemsTotal: 100_000 })).toBe(15000);
  });

  it('adds a per-kilogram fee for the overweight part, rounded up', () => {
    expect(calcDeliveryFee({ zone: zone(), weightGram: 6200, itemsTotal: 100_000 })).toBe(19000);
  });

  it('never exceeds the zone maximum', () => {
    expect(calcDeliveryFee({ zone: zone(), weightGram: 60_000, itemsTotal: 100_000 })).toBe(25000);
  });

  it('is free above the free-delivery threshold', () => {
    expect(
      calcDeliveryFee({ zone: zone({ free_over_total: 300_000 }), weightGram: 20_000, itemsTotal: 300_000 }),
    ).toBe(0);
  });
});

describe('formatEta', () => {
  it('formats hours and days', () => {
    expect(formatEta({ min_hours: 1, max_hours: 24 })).toBe('1 soat — 1 kun');
    expect(formatEta({ min_hours: 72, max_hours: 72 })).toBe('3 kun');
  });
});

describe('resolveZoneByPoint', () => {
  it('returns the nearest zone containing the point', () => {
    const zones = [zone(), zone({ id: 'zone-2', slug: 'zarkent', center_lat: 41.4, center_lng: 69.9, radius_km: 6 })];
    expect(resolveZoneByPoint(zones, { lat: 41.295, lng: 69.684 })?.id).toBe('zone-1');
  });

  it('returns null when the point is outside every radius', () => {
    expect(resolveZoneByPoint([zone({ radius_km: 1 })], { lat: 41.6, lng: 70.2 })).toBeNull();
  });

  it('ignores inactive zones', () => {
    expect(resolveZoneByPoint([zone({ is_active: false })], { lat: 41.29, lng: 69.68 })).toBeNull();
  });
});

describe('distanceKm', () => {
  it('measures a short distance', () => {
    expect(distanceKm({ lat: 41.29, lng: 69.68 }, { lat: 41.29, lng: 69.68 })).toBe(0);
    expect(distanceKm({ lat: 41.29, lng: 69.68 }, { lat: 41.34, lng: 69.68 })).toBeCloseTo(5.56, 1);
  });
});
