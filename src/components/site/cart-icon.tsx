'use client';

import { useEffect, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function CartIcon() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const handler = () => {
      setShowPopup(true);
      setTimeout(() => setShowPopup(false), 900);
    };
    window.addEventListener('cartdrop', handler);
    return () => window.removeEventListener('cartdrop', handler);
  }, []);

  return (
    <Link href="/cart" className="relative text-slate-300 hover:text-emerald-400 transition p-2" aria-label="Savat" data-cart-icon>
      <ShoppingCart className="h-5 w-5" />
      <AnimatePresence>
        {showPopup && (
          <motion.span
            className="absolute -right-1 -top-1 rounded-full bg-emerald-500 px-1.5 py-0.5 text-[10px] font-bold text-white"
            initial={{ scale: 0, y: 0 }}
            animate={{ scale: 1, y: -8 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          >
            +1
          </motion.span>
        )}
      </AnimatePresence>
    </Link>
  );
}
