'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

const CURSOR_SIZE = 10;

export function CustomCursor() {
  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const springX = useSpring(cursorX, { damping: 18, stiffness: 180, mass: 0.3 });
  const springY = useSpring(cursorY, { damping: 18, stiffness: 180, mass: 0.3 });
  const [isVisible, setIsVisible] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; life: number }[]>([]);
  const particleIdRef = useRef(0);
  const lastEmit = useRef(0);

  useEffect(() => {
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (isTouch) return;

    const move = (e: MouseEvent) => {
      cursorX.set(e.clientX);
      cursorY.set(e.clientY);
      setIsVisible(true);

      const now = Date.now();
      if (now - lastEmit.current > 60) {
        lastEmit.current = now;
        const id = particleIdRef.current++;
        setParticles((prev) => {
          const next = [...prev, { id, x: e.clientX, y: e.clientY, life: 1 }];
          return next.length > 8 ? next.slice(-8) : next;
        });
      }
    };

    const leave = () => setIsVisible(false);

    window.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', leave);

    return () => {
      window.removeEventListener('mousemove', move);
      document.removeEventListener('mouseleave', leave);
    };
  }, [cursorX, cursorY]);

  useEffect(() => {
    if (particles.length === 0) return;
    const timer = setTimeout(() => {
      setParticles((prev) => prev.filter((p) => p.life > 0.05));
    }, 600);
    return () => clearTimeout(timer);
  }, [particles]);

  if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

  const half = CURSOR_SIZE / 2;

  return (
    <>
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="pointer-events-none fixed left-0 top-0 z-[9999] rounded-full bg-emerald-400/70"
          style={{
            x: p.x - half,
            y: p.y - half,
            width: CURSOR_SIZE,
            height: CURSOR_SIZE,
            scale: p.life,
            opacity: p.life,
          }}
          animate={{ scale: 0, opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ))}

      <motion.div
        className="pointer-events-none fixed left-0 top-0 z-[10000] rounded-full border border-emerald-400/60 bg-emerald-500/10"
        style={{
          x: springX,
          y: springY,
          width: CURSOR_SIZE,
          height: CURSOR_SIZE,
          translateX: '-50%',
          translateY: '-50%',
          willChange: 'transform',
        }}
        animate={{
          scale: 1,
          opacity: isVisible ? 1 : 0,
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      />
    </>
  );
}
