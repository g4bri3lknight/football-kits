'use client';

import { useCallback, useRef } from 'react';

/** Quadrato del volto: x, y e s (lato) sono frazioni della LARGHEZZA della foto. */
export interface FaceCrop {
  x: number;
  y: number;
  s: number;
}

const MIN_SIZE = 0.08;

/** Ritaglio iniziale: per foto verticali un quadrato in alto (dove sta il volto), per foto quasi quadrate tutta l'immagine. */
export function defaultCrop(width: number, height: number): FaceCrop {
  const ratio = height / width; // altezza espressa in larghezze
  if (ratio <= 1.15) {
    const s = Math.min(1, ratio);
    return { x: (1 - s) / 2, y: 0, s };
  }
  const s = 0.42;
  return { x: (1 - s) / 2, y: 0.04, s };
}

export function clampCrop(c: FaceCrop, width: number, height: number): FaceCrop {
  const ratio = height / width;
  const s = Math.max(MIN_SIZE, Math.min(c.s, Math.min(1, ratio)));
  return {
    s,
    x: Math.max(0, Math.min(c.x, 1 - s)),
    y: Math.max(0, Math.min(c.y, ratio - s)),
  };
}

/** Ritaglia il quadrato dalla foto e lo restituisce come canvas size×size. */
export function cropToCanvas(img: HTMLImageElement, c: FaceCrop, size: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    const n = img.naturalWidth;
    ctx.drawImage(img, c.x * n, c.y * n, c.s * n, c.s * n, 0, 0, size, size);
  }
  return canvas;
}

interface FaceCropperProps {
  src: string;
  crop: FaceCrop;
  imageSize: { width: number; height: number } | null;
  onChange: (crop: FaceCrop) => void;
  onImageLoad: (img: HTMLImageElement) => void;
  /** Altezza massima dell'area in pixel */
  maxHeight?: number;
}

/** Foto con quadrato trascinabile (spostamento) e ridimensionabile (cerchio rosso in basso a destra). */
export function FaceCropper({ src, crop, imageSize, onChange, onImageLoad, maxHeight = 320 }: FaceCropperProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ mode: 'move' | 'resize'; x: number; y: number; start: FaceCrop } | null>(null);

  const aspect = imageSize ? imageSize.width / imageSize.height : 0.75;

  const begin = useCallback(
    (mode: 'move' | 'resize') => (e: React.PointerEvent) => {
      drag.current = { mode, x: e.clientX, y: e.clientY, start: { ...crop } };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      e.preventDefault();
      e.stopPropagation();
    },
    [crop]
  );

  const move = (e: React.PointerEvent) => {
    const d = drag.current;
    const stage = stageRef.current;
    if (!d || !stage || !imageSize) return;
    const w = stage.clientWidth;
    const dx = (e.clientX - d.x) / w;
    const dy = (e.clientY - d.y) / w;
    const next =
      d.mode === 'move'
        ? { ...d.start, x: d.start.x + dx, y: d.start.y + dy }
        : { ...d.start, s: d.start.s + Math.max(dx, dy) };
    onChange(clampCrop(next, imageSize.width, imageSize.height));
  };

  const end = () => {
    drag.current = null;
  };

  return (
    <div
      ref={stageRef}
      className="relative select-none overflow-hidden rounded-lg bg-black"
      style={{ width: Math.round(maxHeight * aspect), maxWidth: '100%', aspectRatio: `${aspect}` }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Foto da ritagliare"
        draggable={false}
        className="pointer-events-none absolute inset-0 block h-full w-full"
        onLoad={(e) => onImageLoad(e.currentTarget)}
      />
      {imageSize && (
        <div
          role="presentation"
          className="absolute cursor-move rounded border-2 border-white"
          style={{
            left: `${crop.x * 100}%`,
            top: `${(crop.y / (imageSize.height / imageSize.width)) * 100}%`,
            width: `${crop.s * 100}%`,
            height: `${(crop.s / (imageSize.height / imageSize.width)) * 100}%`,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.62)',
            touchAction: 'none',
          }}
          onPointerDown={begin('move')}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
        >
          {/* griglia dei terzi */}
          <div className="pointer-events-none absolute inset-y-0 left-1/3 w-1/3 border-x border-white/40" />
          <div className="pointer-events-none absolute inset-x-0 top-1/3 h-1/3 border-y border-white/40" />
          <div
            role="slider"
            aria-label="Ridimensiona il ritaglio"
            aria-valuenow={Math.round(crop.s * 100)}
            className="absolute -bottom-2.5 -right-2.5 h-5 w-5 cursor-nwse-resize rounded-full border-2 border-white bg-[#cd2127]"
            style={{ touchAction: 'none' }}
            onPointerDown={begin('resize')}
            onPointerMove={move}
            onPointerUp={end}
            onPointerCancel={end}
          />
        </div>
      )}
    </div>
  );
}
