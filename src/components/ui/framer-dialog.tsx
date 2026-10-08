'use client';

import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { XIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

// Animation variants - matching Radix UI dialog animations
const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.5 }
  }
};

const contentVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 10
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 30,
      mass: 0.8
    }
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    y: -10,
    transition: { 
      duration: 0.5,
      ease: 'easeOut'
    }
  }
};

interface FramerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  showCloseButton?: boolean;
  /** Permette di bloccare la chiusura (es. mentre è aperto un visualizzatore sopra la finestra) */
  onInteractOutside?: (event: Event) => void;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
}

export function FramerDialog({ 
  open, 
  onOpenChange, 
  children, 
  className,
  style,
  showCloseButton = true,
  onInteractOutside,
  onEscapeKeyDown,
}: FramerDialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <DialogPrimitive.Portal forceMount>
            {/* Overlay */}
            <motion.div
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed inset-0 z-50 bg-black/50"
            />
            
            {/* Content */}
            <DialogPrimitive.Content asChild onInteractOutside={onInteractOutside} onEscapeKeyDown={onEscapeKeyDown}>
              <motion.div
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                style={style}
                className={cn(
                  "fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)] translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border-2 bg-background p-6 shadow-lg dialog-custom-color",
                  className
                )}
              >
                {children}
                {showCloseButton && (
                  <DialogPrimitive.Close
                    className="absolute top-4 right-4 rounded-lg p-1.5 bg-background/80 backdrop-blur-sm border-2 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none cursor-pointer hover:shadow-xl"
                    style={{ 
                      borderColor: '#002f42',
                      transitionDuration: '300ms',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)';
                      e.currentTarget.style.borderColor = '#cd2127';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.borderColor = '#002f42';
                    }}
                  >
                    <XIcon className="w-4 h-4 text-foreground" />
                    <span className="sr-only">Close</span>
                  </DialogPrimitive.Close>
                )}
              </motion.div>
            </DialogPrimitive.Content>
          </DialogPrimitive.Portal>
        )}
      </AnimatePresence>
    </DialogPrimitive.Root>
  );
}

export { DialogPrimitive };
