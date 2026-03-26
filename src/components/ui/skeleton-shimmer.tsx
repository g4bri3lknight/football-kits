'use client';

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonShimmerProps {
  className?: string;
  variant?: 'default' | 'card' | 'avatar' | 'text' | 'badge';
}

// Shimmer effect variant
export function SkeletonShimmer({ className, variant = 'default' }: SkeletonShimmerProps) {
  const baseStyles = "relative overflow-hidden bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%] rounded-md";
  
  const variantStyles = {
    default: "",
    card: "h-48 rounded-xl",
    avatar: "w-12 h-12 rounded-full",
    text: "h-4 rounded",
    badge: "h-5 w-16 rounded-full",
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        className
      )}
      style={{
        animation: "shimmer 2s infinite linear",
      }}
    />
  );
}

// Animated shimmer keyframes (added via CSS)
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

// Player Card Skeleton
export function PlayerCardSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border-2 rounded-lg overflow-hidden backdrop-blur-sm"
    >
      {/* Header with avatar and name */}
      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <SkeletonShimmer variant="avatar" />
          <div className="flex-1 space-y-2">
            <SkeletonShimmer className="h-5 w-32" />
            <div className="flex gap-2">
              <SkeletonShimmer variant="badge" />
              <SkeletonShimmer variant="badge" className="w-20" />
            </div>
          </div>
        </div>
      </div>

      {/* Separator */}
      <div className="h-px bg-border" />

      {/* Kit list skeleton */}
      <div className="p-4 pt-3 space-y-2">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-3 p-2 rounded-lg"
          >
            <SkeletonShimmer className="w-10 h-10 rounded-lg" />
            <div className="flex-1 space-y-1">
              <SkeletonShimmer className="h-4 w-full" />
              <SkeletonShimmer className="h-3 w-20" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// Grid of player card skeletons
export function PlayerCardSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            delay: i * 0.05,
            duration: 0.3,
            ease: "easeOut"
          }}
        >
          <PlayerCardSkeleton />
        </motion.div>
      ))}
    </div>
  );
}

// Kit skeleton for dialogs
export function KitSkeleton() {
  return (
    <div className="space-y-4">
      <SkeletonShimmer className="aspect-square w-full rounded-xl" />
      <div className="space-y-2">
        <SkeletonShimmer className="h-6 w-3/4" />
        <SkeletonShimmer className="h-4 w-1/2" />
      </div>
    </div>
  );
}

// Timeline skeleton
export function TimelineSkeleton() {
  return (
    <div className="space-y-8">
      {Array.from({ length: 3 }).map((_, yearIndex) => (
        <motion.div
          key={yearIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: yearIndex * 0.2 }}
          className="space-y-4"
        >
          <SkeletonShimmer className="h-12 w-24 rounded-full" />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 ml-16">
            {Array.from({ length: 6 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: yearIndex * 0.2 + i * 0.03 }}
              >
                <SkeletonShimmer className="aspect-square rounded-lg" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Comments skeleton
export function CommentsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="flex gap-3 p-4 rounded-lg bg-muted/50"
        >
          <SkeletonShimmer variant="avatar" className="w-10 h-10" />
          <div className="flex-1 space-y-2">
            <SkeletonShimmer className="h-4 w-32" />
            <SkeletonShimmer className="h-4 w-full" />
            <SkeletonShimmer className="h-4 w-3/4" />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// Full page loading overlay with shimmer
export function LoadingOverlay({ message = "Caricamento..." }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-center"
      >
        {/* Animated logo/brand */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: "easeInOut" 
          }}
          className="mb-4"
        >
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-[#002f42] to-[#cd2127] flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-8 h-8 border-4 border-white border-t-transparent rounded-full"
            />
          </div>
        </motion.div>
        <p className="text-muted-foreground font-medium">{message}</p>
      </motion.div>
    </motion.div>
  );
}

export { SkeletonShimmer as Skeleton };
