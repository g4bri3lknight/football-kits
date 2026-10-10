'use client';

import { useEffect } from 'react';

/** Nell'area admin il tema è sempre quello scuro originale: toglie lo stile "figurine" finché si è in admin e lo ripristina uscendo. */
export function AdminForceDark() {
  useEffect(() => {
    const root = document.documentElement;
    const prev = root.dataset.style;
    delete root.dataset.style;
    return () => {
      let saved: string | null = null;
      try { saved = localStorage.getItem('gk-style'); } catch { /* ignora */ }
      if (saved === 'figurine' || prev === 'figurine') root.dataset.style = 'figurine';
    };
  }, []);
  return null;
}
