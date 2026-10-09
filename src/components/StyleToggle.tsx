'use client';

import { useEffect, useState } from 'react';
import { Palette } from 'lucide-react';

type GkStyle = 'dark' | 'figurine';
const KEY = 'gk-style';
const EVT = 'gk-style-change';

/** Piccolo tasto che alterna lo stile scuro e lo stile "figurine". */
export function StyleToggle({ className = '' }: { className?: string }) {
  const [style, setStyle] = useState<GkStyle>('dark');

  useEffect(() => {
    const read = () => setStyle(document.documentElement.dataset.style === 'figurine' ? 'figurine' : 'dark');
    read();
    window.addEventListener(EVT, read);
    return () => window.removeEventListener(EVT, read);
  }, []);

  const toggle = () => {
    const next: GkStyle = style === 'figurine' ? 'dark' : 'figurine';
    if (next === 'figurine') document.documentElement.dataset.style = 'figurine';
    else delete document.documentElement.dataset.style;
    try { localStorage.setItem(KEY, next); } catch { /* ignora */ }
    window.dispatchEvent(new Event(EVT));
  };

  const label = style === 'figurine' ? 'Passa allo stile scuro' : 'Passa allo stile figurine';
  return (
    <button type="button" onClick={toggle} className={`gk-style-toggle ${className}`} title={label} aria-label={label}>
      <Palette className="w-4 h-4" />
    </button>
  );
}
