'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

interface HoverTooltipProps {
  children: ReactNode;
  text: string;
  side?: 'top' | 'bottom' | 'left' | 'right';
  offset?: number;
  /** When true, renders inline instead of via portal (needed inside fullscreen elements) */
  noPortal?: boolean;
}

/**
 * Tooltip personalizzato che sostituisce il nativo `title` HTML.
 * Usa lo stesso stile del tooltip sulle card dei kit (bg-popover, border, shadow, rounded).
 * Di default renderizza tramite portal su document.body per sfuggire a overflow/transform.
 * Con noPortal=true renderizza inline (utile dentro elementi in fullscreen).
 */
export function HoverTooltip({ children, text, side = 'top', offset = 6, noPortal }: HoverTooltipProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setMounted(true); }, []);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    let top: number;
    let left: number;

    switch (side) {
      case 'bottom':
        top = rect.bottom + offset;
        left = rect.left + rect.width / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2;
        left = rect.left - offset;
        break;
      case 'right':
        top = rect.top + rect.height / 2;
        left = rect.right + offset;
        break;
      default: // top
        top = rect.top - offset;
        left = rect.left + rect.width / 2;
    }

    setPos({ top, left });
    setVisible(true);
  }, [side, offset]);

  const hide = useCallback(() => {
    timer.current = setTimeout(() => setVisible(false), 80);
  }, []);

  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setVisible(false);
  }, []);

  useEffect(() => {
    return () => clearTimeout(timer.current);
  }, []);

  const translateX = side === 'left' ? '-100%' : side === 'right' ? '0' : '-50%';
  const translateY = side === 'bottom' ? '0' : side === 'top' ? '-100%' : '-50%';

  const tooltipEl = (
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ top: pos.top, left: pos.left, transform: `translate(${translateX}, ${translateY})` }}
    >
      <div className="bg-popover text-popover-foreground border rounded-md shadow-lg px-2.5 py-1.5 text-xs whitespace-nowrap text-center">
        {text}
      </div>
    </div>
  );

  return (
    <>
      <div ref={ref} onMouseEnter={show} onMouseLeave={hide} onMouseDown={dismiss}>
        {children}
      </div>
      {mounted && visible && (noPortal ? tooltipEl : createPortal(tooltipEl, document.body))}
    </>
  );
}
