'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

function PackageState({ weight }: { weight: number }) {
  if (weight <= 5) return { label: 'Standart Eko-Xalta', color: 'from-emerald-500/40 to-emerald-700/40', scale: 0.85 };
  if (weight <= 20) return { label: 'Premium Yog‘och Quti', color: 'from-amber-500/40 to-amber-700/40', scale: 1.05 };
  return { label: 'Ulgurji Optom Xashamdor O‘ram', color: 'from-brand-500/40 to-brand-700/40', scale: 1.25 };
}

function CountUp({ value, prefix = '', suffix = '' }: { value: number; prefix?: string; suffix?: string }) {
  const [display, setDisplay] = useState(value);
  const prevValueRef = useRef(value);

  useEffect(() => {
    const start = prevValueRef.current;
    const end = value;
    prevValueRef.current = value;
    const duration = 600;
    const startTime = performance.now();
    let raf: number;

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + (end - start) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const formatted = display.toLocaleString('uz-UZ');
  return (
    <span className="tabular-nums">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export function WeightMorphProduct({ basePricePerKg = 45000 }: { basePricePerKg?: number }) {
  const [weight, setWeight] = useState(5);
  const smoothWeight = useSpring(weight, { stiffness: 180, damping: 20, mass: 0.4 });
  const pkg = useMemo(() => PackageState({ weight }), [weight]);

  const scale = useTransform(smoothWeight, [1, 50], [0.85, 1.45]);

  return (
    <div className="glass-card rounded-3xl p-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col items-center justify-center gap-6">
          <motion.div
            className="relative flex items-center justify-center rounded-3xl border border-white/20 bg-white/5 p-10"
            style={{ scale, transformStyle: 'preserve-3d', willChange: 'transform' }}
          >
            <motion.div
              className={`h-40 w-40 rounded-2xl bg-gradient-to-br ${pkg.color} shadow-[0_0_40px_rgba(16,185,129,0.25)] backdrop-blur-xl`}
              animate={{ rotateY: [0, 8, -8, 0], rotateX: [0, -6, 6, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="absolute -bottom-3 rounded-full border border-white/20 bg-slate-900/90 px-4 py-1 text-xs font-bold text-emerald-300 backdrop-blur-xl">
              {pkg.label}
            </div>
          </motion.div>

          <div className="w-full">
            <label className="mb-2 flex items-center justify-between text-sm text-slate-300">
              <span>Og‘irlikni tanlang</span>
              <span className="font-bold text-emerald-400">{weight} kg</span>
            </label>
            <input
              type="range"
              min={1}
              max={50}
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-500"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>1 kg</span>
              <span>50 kg</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div>
            <p className="text-xs text-slate-300">Jami narx</p>
            <p className="text-3xl font-extrabold text-emerald-400">
              <CountUp value={Math.round(basePricePerKg * weight)} prefix="" suffix=" so‘m" />
            </p>
          </div>
          <div className="text-xs text-slate-300">
            <p>1 kg = <span className="font-semibold text-white">{basePricePerKg.toLocaleString('uz-UZ')} so‘m</span></p>
            <p>Og‘irlik: <span className="font-semibold text-white">{weight} kg</span></p>
            <p>Qadoq: <span className="font-semibold text-emerald-300">{pkg.label}</span></p>
          </div>
          <motion.button
            whileTap={{ scale: 0.97 }}
            className="w-full rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 py-3 text-sm font-bold text-white shadow-lg hover:from-brand-600 hover:to-brand-700"
          >
            🛒 Savatga qo‘shish
          </motion.button>
        </div>
      </div>
    </div>
  );
}
