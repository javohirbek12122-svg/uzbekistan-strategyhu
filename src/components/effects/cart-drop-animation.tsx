'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

export function CartDropAnimation({ productImage, onComplete }: { productImage?: string; onComplete?: () => void }) {
  const cloneRef = useRef<HTMLImageElement | null>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<{ imageUrl?: string }>;
      const imageUrl = custom.detail?.imageUrl;
      if (imageUrl) {
        setActive(true);
      }
    };
    window.addEventListener('cartdrop', handler as EventListener);
    return () => window.removeEventListener('cartdrop', handler as EventListener);
  }, []);

  useEffect(() => {
    if (!productImage || !active) return;
    const clone = document.createElement('img');
    clone.src = productImage;
    clone.alt = '';
    cloneRef.current = clone;
    clone.style.cssText = 'position:fixed;width:80px;height:80px;object-fit:cover;border-radius:16px;z-index:9999;pointer-events:none;box-shadow:0 10px 30px rgba(0,0,0,0.4);';
    document.body.appendChild(clone);

    const startEl = document.querySelector('[data-cart-drop-trigger]') as HTMLElement | null;
    const endEl = document.querySelector('[data-cart-icon]') as HTMLElement | null;
    if (!startEl || !endEl) {
      document.body.removeChild(clone);
      setActive(false);
      onComplete?.();
      return;
    }

    const start = startEl.getBoundingClientRect();
    const end = endEl.getBoundingClientRect();
    clone.style.left = `${start.left + start.width / 2 - 40}px`;
    clone.style.top = `${start.top + start.height / 2 - 40}px`;

    const popup = document.createElement('div');
    popup.textContent = '+1';
    popup.style.cssText = 'position:fixed;z-index:9999;pointer-events:none;font-weight:bold;color:#10b981;font-size:16px;';
    document.body.appendChild(popup);

    const ctx = gsap.context(() => {
      gsap.to(clone, {
        motionPath: {
          path: [
            { x: 0, y: 0 },
            { x: (end.left - start.left) * 0.5, y: -80 },
            { x: end.left - start.left, y: end.top - start.top + 120 },
          ],
          curviness: 1.8,
        },
        duration: 1.1,
        ease: 'power2.in',
        onComplete: () => {
          gsap.to(clone, { scale: 0.2, opacity: 0, duration: 0.25, ease: 'power2.in' });
          gsap.to(endEl, {
            keyframes: [{ scale: 1.35 }, { scale: 0.9 }, { scale: 1 }],
            duration: 0.5,
            ease: 'elastic.out(1, 0.4)',
          });
          gsap.fromTo(
            popup,
            { x: end.left + end.width / 2, y: end.top, opacity: 1, scale: 1 },
            { y: -60, opacity: 0, scale: 1.4, duration: 0.9, ease: 'power2.out', onComplete: () => popup.remove() }
          );
          onComplete?.();
          setTimeout(() => {
            if (clone.parentNode) clone.parentNode.removeChild(clone);
            setActive(false);
          }, 700);
        },
      });
    });

    return () => ctx.revert();
  }, [active, productImage, onComplete]);

  return null;
}

export function useCartDrop() {
  const [image, setImage] = useState<string | undefined>(undefined);
  const trigger = (src?: string) => setImage(src);
  const reset = () => setImage(undefined);
  return { cartDropImage: image, triggerCartDrop: trigger, resetCartDrop: reset };
}
