'use client';

import { useState, useEffect } from 'react';
import { Truck, Clock, Zap, Users, Share2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getShippingStrategy, getBatchProgress, getNextDeliveryDay } from '@/lib/logisticsEngine';
import type { ShippingOption } from '@/lib/logisticsEngine';
import type { DeliveryZone } from '@/lib/types';

interface CheckoutLogicProps {
  weightKg: number;
  zone: DeliveryZone | null;
  distanceKm?: number;
  onSelectShipping: (option: ShippingOption) => void;
  selectedShipping?: ShippingOption | null;
}

export function CheckoutLogic({ weightKg, zone, distanceKm = 0, onSelectShipping, selectedShipping }: CheckoutLogicProps) {
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [batchProgress, setBatchProgress] = useState(getBatchProgress(weightKg));

  useEffect(() => {
    const strategy = getShippingStrategy(weightKg, zone, distanceKm);
    setOptions(strategy);
    setBatchProgress(getBatchProgress(weightKg));
  }, [weightKg, zone, distanceKm]);

  const handleShare = async (platform: 'telegram' | 'whatsapp') => {
    const text = `🚚 Parkent E-Mart - Labo Batch Progress\n\n📦 Mening savatim: ${weightKg} kg\n🎯 Maqsad: 70 kg\n📊 Holat: ${batchProgress.percentage.toFixed(0)}% to'ldi\n\nQo'shnilar bilan bo'ling, TEKIN Labo yetkazib berishni oling!`;
    const url = window.location.origin;

    if (platform === 'telegram') {
      window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
    }
  };

  const getShippingIcon = (type: string) => {
    switch (type) {
      case 'DAMAS_EXPRESS':
        return <Truck className="h-5 w-5" />;
      case 'LABO_SCHEDULED':
        return <Users className="h-5 w-5" />;
      case 'LABO_VIP':
        return <Zap className="h-5 w-5" />;
      default:
        return <Truck className="h-5 w-5" />;
    }
  };

  const getShippingColor = (type: string) => {
    switch (type) {
      case 'DAMAS_EXPRESS':
        return 'from-blue-500 to-cyan-500';
      case 'LABO_SCHEDULED':
        return 'from-emerald-500 to-green-500';
      case 'LABO_VIP':
        return 'from-amber-500 to-orange-500';
      default:
        return 'from-slate-500 to-slate-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Batch Progress Widget */}
      {weightKg < 70 && (
        <motion.div
          className="glass-card rounded-2xl p-4 border-emerald-500/30"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">🚚 Labo Batch Progress</h3>
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
          <p className="mb-3 text-xs text-slate-300">{batchProgress.message}</p>
          {batchProgress.remaining > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => handleShare('telegram')}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-blue-500/20 px-3 py-2 text-xs font-medium text-blue-300 transition hover:bg-blue-500/30"
              >
                <Share2 className="h-3 w-3" />
                Telegram
              </button>
              <button
                onClick={() => handleShare('whatsapp')}
                className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-500/20 px-3 py-2 text-xs font-medium text-green-300 transition hover:bg-green-500/30"
              >
                <Share2 className="h-3 w-3" />
                WhatsApp
              </button>
            </div>
          )}
        </motion.div>
      )}

      {/* Shipping Options */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-white">Yetkazib berish usulini tanlang:</h3>
        {options.map((option, index) => (
          <motion.button
            key={option.type}
            onClick={() => onSelectShipping(option)}
            className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
              selectedShipping?.type === option.type
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20'
            }`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-lg bg-gradient-to-br ${getShippingColor(option.type)} p-2 text-white`}>
                {getShippingIcon(option.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white">{option.label}</h4>
                  <span className="text-sm font-bold text-emerald-400">
                    {option.price === 0 ? 'TEKIN' : `${option.price.toLocaleString('uz-UZ')} so'm`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-300">{option.description}</p>
                <div className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                  <Clock className="h-3 w-3" />
                  {option.estimatedTime}
                </div>
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {zone && (
        <div className="rounded-lg bg-white/5 p-3 text-xs text-slate-300">
          <p>📍 {zone.name_uz}</p>
          <p>📅 Keyingi yetkazish: {getNextDeliveryDay(zone.slug)}</p>
        </div>
      )}
    </div>
  );
}
