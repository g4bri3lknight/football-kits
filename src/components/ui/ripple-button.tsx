'use client';

import { useState, useCallback, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, ButtonProps } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface RippleButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  rippleColor?: string;
}

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const RippleButton = forwardRef<HTMLButtonElement, RippleButtonProps>(
  ({ 
    children, 
    loading = false, 
    loadingText,
    rippleColor = 'rgba(255, 255, 255, 0.3)',
    className,
    disabled,
    onClick,
    ...props 
  }, ref) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      if (loading || disabled) return;
      
      const button = buttonRef.current || (ref as React.RefObject<HTMLButtonElement>)?.current;
      if (!button) return;
      
      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      const newRipple = {
        id: Date.now(),
        x,
        y,
        size,
      };
      
      setRipples(prev => [...prev, newRipple]);
      
      // Remove ripple after animation
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r.id !== newRipple.id));
      }, 600);
      
      onClick?.(e);
    }, [loading, disabled, onClick, ref]);
    
    return (
      <Button
        ref={ref || buttonRef}
        className={cn(
          'relative overflow-hidden',
          loading && 'cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="absolute rounded-full pointer-events-none"
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
                backgroundColor: rippleColor,
              }}
            />
          ))}
        </AnimatePresence>
        
        {/* Content */}
        <span className={cn(
          'relative z-10 flex items-center justify-center gap-2',
          loading && 'opacity-0'
        )}>
          {children}
        </span>
        
        {/* Loading state */}
        <AnimatePresence>
          {loading && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex items-center justify-center gap-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              >
                <Loader2 className="w-4 h-4" />
              </motion.div>
              {loadingText && <span>{loadingText}</span>}
            </motion.span>
          )}
        </AnimatePresence>
      </Button>
    );
  }
);

RippleButton.displayName = 'RippleButton';

export default RippleButton;
