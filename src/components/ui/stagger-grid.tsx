'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

// Stagger container - wraps grid items
interface StaggerGridProps {
  children: ReactNode;
  className?: string;
  staggerDelay?: number;
  initialDelay?: number;
}

export function StaggerGrid({ 
  children, 
  className,
  staggerDelay = 0.08,
  initialDelay = 0.1 
}: StaggerGridProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
            delayChildren: initialDelay,
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger item - wraps each card
interface StaggerItemProps {
  children: ReactNode;
  className?: string;
}

export function StaggerItem({ children, className }: StaggerItemProps) {
  return (
    <motion.div
      variants={{
        hidden: { 
          opacity: 0, 
          y: 30,
          scale: 0.95
        },
        visible: { 
          opacity: 1, 
          y: 0,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25
          }
        }
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Animated card wrapper with enhanced hover effects
interface AnimatedCardWrapperProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function AnimatedCardWrapper({ children, className, onClick }: AnimatedCardWrapperProps) {
  return (
    <motion.div
      variants={{
        hidden: { 
          opacity: 0, 
          y: 30,
          scale: 0.95
        },
        visible: { 
          opacity: 1, 
          y: 0,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 25
          }
        }
      }}
      whileHover={{ 
        scale: 1.03,
        y: -5,
        transition: { type: 'spring', stiffness: 400, damping: 20 }
      }}
      whileTap={{ 
        scale: 0.98,
        transition: { type: 'spring', stiffness: 400, damping: 20 }
      }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}
