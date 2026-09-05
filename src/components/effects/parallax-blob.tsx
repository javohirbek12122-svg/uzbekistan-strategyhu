'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

export function ParallaxBlobs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: containerRef });

  const blob1Y = useTransform(scrollY, [0, 800], [0, -120]);
  const blob2Y = useTransform(scrollY, [0, 800], [0, -80]);
  const blob3Y = useTransform(scrollY, [0, 800], [0, -160]);

  return (
    <div ref={containerRef} className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <motion.div
        className="absolute top-[15%] left-[20%] h-[420px] w-[420px] rounded-full bg-emerald-500/15 blur-[130px]"
        style={{ y: blob1Y, willChange: 'transform' }}
      />
      <motion.div
        className="absolute bottom-[18%] right-[18%] h-[360px] w-[360px] rounded-full bg-purple-500/15 blur-[120px]"
        style={{ y: blob2Y, willChange: 'transform' }}
      />
      <motion.div
        className="absolute top-[45%] left-[55%] h-[280px] w-[280px] rounded-full bg-brand-500/10 blur-[110px]"
        style={{ y: blob3Y, willChange: 'transform' }}
      />
    </div>
  );
}
