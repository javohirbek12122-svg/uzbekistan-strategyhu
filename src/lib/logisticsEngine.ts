import type { DeliveryZone } from './types';

export type ShippingType = 'DAMAS_EXPRESS' | 'LABO_SCHEDULED' | 'LABO_VIP';

export interface ShippingOption {
  type: ShippingType;
  price: number;
  estimatedTime: string;
  label: string;
  description: string;
}

export interface ZoneSchedule {
  zoneId: string;
  zoneName: string;
  deliveryDay: string;
  deliveryTime: string;
  villages: string[];
}

export const ZONE_SCHEDULES: ZoneSchedule[] = [
  {
    zoneId: 'zarkent-hisarak',
    zoneName: 'Zarkent & Hisarak',
    deliveryDay: 'Dushanba',
    deliveryTime: 'Ertalab 08:00 - 12:00',
    villages: ['Zarkent', 'Hisarak'],
  },
  {
    zoneId: 'soqoq-kumushkon',
    zoneName: "So'qoq & Kumushkon",
    deliveryDay: 'Chorshanba',
    deliveryTime: 'Ertalab 08:00 - 12:00',
    villages: ["So'qoq", 'Kumushkon'],
  },
  {
    zoneId: 'yangibozor',
    zoneName: 'Yangibozor',
    deliveryDay: 'Juma',
    deliveryTime: 'Ertalab 08:00 - 12:00',
    villages: ['Yangibozor'],
  },
  {
    zoneId: 'parkent-center',
    zoneName: 'Parkent Markaz',
    deliveryDay: 'Har kuni',
    deliveryTime: 'Kechqurun 18:00 - 20:00',
    villages: ['Parkent shahar', 'Parkent markaz'],
  },
];

const LABO_MIN_WEIGHT_KG = 70;
const LABO_MAX_WEIGHT_KG = 1000;
const DAMAS_FLAT_FEE = 5000;
const VIP_FUEL_RATE_PER_KM = 250;

export function getShippingStrategy(weightKg: number, zone: Pick<DeliveryZone, 'slug' | 'name_uz'> | null, distanceKm = 0): ShippingOption[] {
  if (weightKg < LABO_MIN_WEIGHT_KG) {
    return [
      {
        type: 'DAMAS_EXPRESS',
        price: DAMAS_FLAT_FEE,
        estimatedTime: 'Bugun (Damas pochtasi)',
        label: 'Damas Micro-Transit',
        description: `Arzon, tez. ${weightKg} kg ni Damas stantsiyasi orqali yuboramiz.`,
      },
      {
        type: 'LABO_SCHEDULED',
        price: 0,
        estimatedTime: formatScheduledTime(zone),
        label: 'Rejali Labo (BATCH)',
        description: `Qo'shnilar bilan birlashganda TEKIN Labo. Hozircha ${LABO_MIN_WEIGHT_KG - weightKg} kg yetishmayapti.`,
      },
      {
        type: 'LABO_VIP',
        price: calculateFuelCost(distanceKm),
        estimatedTime: '2-4 soat (Maxsus)',
        label: 'VIP Express Labo',
        description: `Shaxsiy Labo. Yoqilg'i to'lovi ${formatMoney(calculateFuelCost(distanceKm))} so'm.`,
      },
    ];
  }

  if (weightKg <= LABO_MAX_WEIGHT_KG) {
    return [
      {
        type: 'LABO_SCHEDULED',
        price: 0,
        estimatedTime: formatScheduledTime(zone),
        label: 'Rejali Labo (BATCH)',
        description: `✅ ${weightKg} kg Labo sig'imi yetarli. REJALASHTIRILGAN KUNDA TEKIN yetkazib beramiz.`,
      },
    ];
  }

  return [
    {
      type: 'LABO_SCHEDULED',
      price: 0,
      estimatedTime: formatScheduledTime(zone),
      label: 'Rejali Labo (BATCH)',
      description: `⚠️ ${weightKg} kg 1 tonnadan oshdi. Qayta bo'lib yuborish mumkin.`,
    },
  ];
}

export function calculateFuelCost(distanceKm: number): number {
  return Math.round(distanceKm * VIP_FUEL_RATE_PER_KM);
}

export function getZoneSchedule(zoneSlug: string | null): ZoneSchedule | undefined {
  if (!zoneSlug) return ZONE_SCHEDULES[3];
  const normalized = zoneSlug.toLowerCase().replace(/[^a-z0-9]+/g, '');
  return ZONE_SCHEDULES.find((z) => normalized.includes(z.zoneId.replace('-', ''))) ?? ZONE_SCHEDULES[3];
}

export function getNextDeliveryDay(zoneSlug: string | null): string {
  const schedule = getZoneSchedule(zoneSlug);
  if (!schedule) return 'Har kuni';
  if (schedule.deliveryDay === 'Har kuni') return 'Bugun';

  const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
  const today = new Date().getDay();
  const targetDay = days.indexOf(schedule.deliveryDay);
  let daysUntil = targetDay - today;
  if (daysUntil <= 0) daysUntil += 7;

  return daysUntil === 0 ? 'Bugun' : `${daysUntil} kundan keyin (${schedule.deliveryDay})`;
}

export function formatScheduledTime(zone: Pick<DeliveryZone, 'slug' | 'name_uz'> | null): string {
  const schedule = getZoneSchedule(zone?.slug ?? null);
  if (!schedule) return 'Rejali vaqtda';
  return `${schedule.deliveryDay}, ${schedule.deliveryTime}`;
}

export function getBatchProgress(currentKg: number): { percentage: number; remaining: number; message: string } {
  const remaining = Math.max(0, LABO_MIN_WEIGHT_KG - currentKg);
  const percentage = Math.min(100, (currentKg / LABO_MIN_WEIGHT_KG) * 100);

  let message = '';
  if (currentKg >= LABO_MIN_WEIGHT_KG) {
    message = '✅ Labo Batch to\'ldi! Tez orada yuboriladi.';
  } else if (currentKg >= 50) {
    message = `📦 ${remaining} kg qoldi. Qo'shnilar bilan bo'ling!`;
  } else if (currentKg >= 25) {
    message = `📈 Yaxshi! Yana ${remaining} kg kerak.`;
  } else {
    message = `🚀 Labo Batch: ${currentKg}/${LABO_MIN_WEIGHT_KG} kg. Do'stlaringizni taklif qiling!`;
  }

  return { percentage, remaining, message };
}

function formatMoney(amount: number): string {
  return amount.toLocaleString('uz-UZ');
}
