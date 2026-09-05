'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/store/app-store';

export function PwaInitializer() {
  const setMounted = useAppStore((s) => s.setMounted);
  const setOnline = useAppStore((s) => s.setOnline);
  const setPwaInstalled = useAppStore((s) => s.setPwaInstalled);

  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    const updateOnline = () => setOnline(navigator.onLine);
    updateOnline();
    window.addEventListener('online', updateOnline);
    window.addEventListener('offline', updateOnline);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          if (reg.active) {
            setPwaInstalled(true);
          }
        })
        .catch(() => {});
    }

    const installed = window.matchMedia('(display-mode: standalone)').matches;
    if (installed) setPwaInstalled(true);

    return () => {
      window.removeEventListener('online', updateOnline);
      window.removeEventListener('offline', updateOnline);
    };
  }, [setMounted, setOnline, setPwaInstalled]);

  return null;
}
