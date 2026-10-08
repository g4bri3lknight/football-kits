'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Minus, Plus, X } from 'lucide-react';

interface PhotoViewerProps {
  open: boolean;
  src: string;
  title?: string;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 5;

/**
 * Visualizzatore a schermo intero: clic o rotellina per ingrandire, trascinamento per spostare,
 * Esc o clic sullo sfondo per chiudere. Si monta su document.body, sopra qualsiasi finestra.
 */
export function PhotoViewer({ open, src, title, onClose }: PhotoViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);

  useEffect(() => setMounted(true), []);

  // Ogni apertura riparte da "adatta allo schermo"
  useEffect(() => {
    if (open) {
      setZoom(1);
      setPos({ x: 0, y: 0 });
    }
  }, [open, src]);

  const applyZoom = useCallback((next: number) => {
    const z = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, next));
    setZoom(z);
    if (z === 1) setPos({ x: 0, y: 0 });
  }, []);

  // Esc chiude solo il visualizzatore (in fase di cattura, prima della finestra sottostante)
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === '+' || e.key === '=') {
        applyZoom(zoom + 0.75);
      } else if (e.key === '-') {
        applyZoom(zoom - 0.75);
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [open, onClose, zoom, applyZoom]);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title ? `Foto di ${title}` : 'Foto'}
      // Radix imposta pointer-events:none sul body quando una finestra è aperta: qui serve riattivarli
      style={{ pointerEvents: 'auto' }}
      className="fixed inset-0 z-[300] flex items-center justify-center overflow-hidden bg-black/95"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onWheel={(e) => applyZoom(zoom + (e.deltaY < 0 ? 0.4 : -0.4))}
    >
      <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
        <span className="text-base font-semibold text-white">{title}</span>
        <div className="flex gap-2">
          <button
            type="button"
            aria-label="Ingrandisci"
            onClick={() => applyZoom(zoom + 0.75)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Plus className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Riduci"
            onClick={() => applyZoom(zoom - 0.75)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-white/20"
          >
            <Minus className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Chiudi"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white hover:bg-[#cd2127]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={title ? `Foto di ${title}` : 'Foto'}
        draggable={false}
        className="max-h-full max-w-full select-none object-contain"
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px) scale(${zoom})`,
          transition: drag.current ? 'none' : 'transform 0.2s ease',
          cursor: zoom > 1 ? 'grab' : 'zoom-in',
          touchAction: 'none',
        }}
        onPointerDown={(e) => {
          drag.current = { x: e.clientX, y: e.clientY, px: pos.x, py: pos.y, moved: false };
          e.currentTarget.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || zoom === 1) return;
          const dx = e.clientX - d.x;
          const dy = e.clientY - d.y;
          if (Math.abs(dx) + Math.abs(dy) > 3) d.moved = true;
          setPos({ x: d.px + dx, y: d.py + dy });
        }}
        onPointerUp={() => {
          const d = drag.current;
          drag.current = null;
          if (d && !d.moved) applyZoom(zoom > 1 ? 1 : 2.4);
        }}
      />

      <p className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
        <span className="rounded-full bg-black/60 px-3 py-1 text-center text-xs text-white/80">
          Clic sulla foto o + / − per ingrandire · trascina per spostare · Esc per chiudere
        </span>
      </p>
    </div>,
    document.body
  );
}
