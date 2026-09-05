'use client';

import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';

const EASTER_EGG_KEY = 'parkent-uzum-clicks';
const REQUIRED_CLICKS = 3;
const WINDOW_MS = 2000;

export function ScratchCardEasterEgg() {
  const [open, setOpen] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    if (!open) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = containerRef.current;
    if (!parent) return;

    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctxRef.current = ctx;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.lineWidth = 40;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let startX = 0;
    let startY = 0;

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : (e as MouseEvent).clientY;
      return { x: clientX - rect.left, y: clientY - rect.top };
    };

    const startDraw = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const p = getPos(e);
      startX = p.x;
      startY = p.y;
    };

    const moveDraw = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const p = getPos(e);
      ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        startX = p.x;
        startY = p.y;
        updateProgress();
    };

    const endDraw = () => {
      isDrawing.current = false;
    };

    const updateProgress = () => {
      if (!canvas || !ctxRef.current) return;
      const imageData = ctxRef.current.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;
      let transparent = 0;
      for (let i = 3; i < pixels.length; i += 4) {
        if (pixels[i] === 0) transparent++;
      }
      const total = canvas.width * canvas.height;
      setScratchProgress(Math.min(1, transparent / total));
    };

    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', moveDraw);
    canvas.addEventListener('mouseup', endDraw);
    canvas.addEventListener('mouseleave', endDraw);
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', moveDraw, { passive: false });
    canvas.addEventListener('touchend', endDraw);

    return () => {
      canvas.removeEventListener('mousedown', startDraw);
      canvas.removeEventListener('mousemove', moveDraw);
      canvas.removeEventListener('mouseup', endDraw);
      canvas.removeEventListener('mouseleave', endDraw);
      canvas.removeEventListener('touchstart', startDraw);
      canvas.removeEventListener('touchmove', moveDraw);
      canvas.removeEventListener('touchend', endDraw);
    };
  }, [open]);

  useEffect(() => {
    if (open && scratchProgress > 0.35) {
      fireConfetti();
      setTimeout(() => {
        setOpen(false);
        setScratchProgress(0);
      }, 1200);
    }
  }, [open, scratchProgress]);

  const fireConfetti = () => {
    const end = Date.now() + 1200;
    const interval = setInterval(() => {
      confetti({ particleCount: 8, spread: 70, startVelocity: 45, colors: ['#10b981', '#f7b500', '#ffffff'], gravity: 0.8 });
      if (Date.now() > end) clearInterval(interval);
    }, 120);
  };

  const handleLogoClick = () => {
    const raw = localStorage.getItem(EASTER_EGG_KEY);
    const clicks = raw ? JSON.parse(raw) : [];
    const now = Date.now();
    const recent = clicks.filter((t: number) => now - t < WINDOW_MS);
    recent.push(now);
    localStorage.setItem(EASTER_EGG_KEY, JSON.stringify(recent));
    if (recent.length >= REQUIRED_CLICKS) {
      localStorage.removeItem(EASTER_EGG_KEY);
      setOpen(true);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleLogoClick}
        className="fixed bottom-6 right-6 z-40 rounded-full border border-white/10 bg-slate-900/80 p-3 text-xs text-slate-300 backdrop-blur-xl transition hover:border-emerald-500/40 hover:text-emerald-300"
        aria-label="Easter egg"
      >
        🍇
      </button>

      {open && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div ref={containerRef} className="relative w-[320px] overflow-hidden rounded-3xl border border-white/20 bg-slate-900/90 p-6 shadow-2xl">
            <h3 className="mb-2 text-center text-lg font-bold text-white">🎉 Siz yutdingiz!</h3>
            <p className="mb-4 text-center text-sm text-slate-300">Chekirmangiz: 5 000 so‘m chegirma kodi</p>
            <div className="relative rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <code className="text-sm font-bold text-emerald-300">PARKENT-EGG-5000</code>
            </div>
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full cursor-crosshair" />
            <button
              type="button"
              onClick={() => { setOpen(false); setScratchProgress(0); }}
              className="absolute right-3 top-3 rounded-full bg-white/10 px-2 py-1 text-xs text-white backdrop-blur-sm"
            >
              Yopish
            </button>
          </div>
        </div>
      )}
    </>
  );
}
