'use client';

import { useEffect } from 'react';

/**
 * Backward-compatible admin entry point.
 *
 * Hash fragments never reach Next.js routing, so /#admin must be handled in
 * the browser and forwarded to the real protected console route.
 */
export function AdminHashRouter() {
  useEffect(() => {
    const redirectAdminHash = () => {
      if (window.location.hash.toLowerCase() !== '#admin') return;
      window.location.replace('/__console/login');
    };

    redirectAdminHash();
    window.addEventListener('hashchange', redirectAdminHash);
    return () => window.removeEventListener('hashchange', redirectAdminHash);
  }, []);

  return null;
}
