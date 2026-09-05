'use client';

import { motion } from 'framer-motion';
import { MapPin, Clock, Users } from 'lucide-react';
import { ZONE_SCHEDULES, getBatchProgress } from '@/lib/logisticsEngine';
import type { DeliveryZone } from '@/lib/types';

interface ZoneMapProps {
  zones: DeliveryZone[];
  currentWeight?: number;
  selectedZone?: DeliveryZone | null;
  onSelectZone?: (zone: DeliveryZone) => void;
}

export function ZoneMap({ zones, currentWeight = 0, selectedZone, onSelectZone }: ZoneMapProps) {
  const batchProgress = getBatchProgress(currentWeight);

  const getZoneStatus = (zone: DeliveryZone) => {
    const schedule = ZONE_SCHEDULES.find((z) => zone.slug?.includes(z.zoneId.replace('-', '')));
    if (!schedule) return { status: 'unknown', color: 'slate' };

    const today = new Date().getDay();
    const days = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const targetDay = days.indexOf(schedule.deliveryDay);

    if (schedule.deliveryDay === 'Har kuni') {
      return { status: 'active', color: 'emerald', label: 'Bugun yetkaziladi' };
    }

    if (today === targetDay) {
      return { status: 'today', color: 'brand', label: 'Bugun yetkaziladi' };
    }

    if ((targetDay - today + 7) % 7 <= 2) {
      return { status: 'soon', color: 'amber', label: `${schedule.deliveryDay} kuni` };
    }

    return { status: 'scheduled', color: 'slate', label: schedule.deliveryDay };
  };

  return (
    <div className="space-y-4">
      {/* Batch Progress */}
      <motion.div
        className="glass-card rounded-2xl p-4 border-emerald-500/30"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">🚚 Labo Batch Holati</h3>
          <span className="text-xs text-emerald-300">{batchProgress.percentage.toFixed(0)}%</span>
        </div>
        <div className="mb-2 h-3 overflow-hidden rounded-full bg-white/10">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-brand-500"
            initial={{ width: 0 }}
            animate={{ width: `${batchProgress.percentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
        <p className="text-xs text-slate-300">{batchProgress.message}</p>
      </motion.div>

      {/* Zone Map */}
      <div className="glass-card rounded-2xl p-4">
        <h3 className="mb-4 text-sm font-bold text-white">📍 Yetkazish Xaritasi</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {zones.map((zone, index) => {
            const zoneStatus = getZoneStatus(zone);
            const schedule = ZONE_SCHEDULES.find((z) => zone.slug?.includes(z.zoneId.replace('-', '')));
            const isSelected = selectedZone?.id === zone.id;

            return (
              <motion.div
                key={zone.id}
                onClick={() => onSelectZone?.(zone)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-400" />
                      <h4 className="text-sm font-bold text-white">{zone.name_uz}</h4>
                    </div>
                    {schedule && (
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center gap-1 text-xs text-slate-300">
                          <Clock className="h-3 w-3" />
                          {schedule.deliveryDay}, {schedule.deliveryTime}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Users className="h-3 w-3" />
                          {schedule.villages.join(', ')}
                        </div>
                      </div>
                    )}
                  </div>
                  <div
                    className={`rounded-full px-2 py-1 text-xs font-bold ${
                      zoneStatus.color === 'emerald'
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : zoneStatus.color === 'brand'
                        ? 'bg-brand-500/20 text-brand-300'
                        : zoneStatus.color === 'amber'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-slate-500/20 text-slate-300'
                    }`}
                  >
                    {zoneStatus.label}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300">Bugun</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-brand-500" />
          <span className="text-slate-300">Yaqinda</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-amber-500" />
          <span className="text-slate-300">Rejali</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="h-3 w-3 rounded-full bg-slate-500" />
          <span className="text-slate-300">Kechikkan</span>
        </div>
      </div>
    </div>
  );
}
