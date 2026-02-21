'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BackToTopProps {
  /** Soglia di scroll in pixel per mostrare il pulsante (default: 300) */
  threshold?: number
  /** Posizione orizzontale ('left' | 'right') */
  position?: 'left' | 'right'
  /** Offset dal basso in pixel */
  bottomOffset?: string
  /** Offset laterale in pixel */
  sideOffset?: string
  /** Classe CSS aggiuntiva */
  className?: string
  /** Variante del pulsante */
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  /** Dimensione del pulsante */
  size?: 'default' | 'sm' | 'lg' | 'icon'
  /** Durata dell'animazione di scroll in ms */
  scrollDuration?: number
  /** 
   * Riferimento al contenitore scrollabile. 
   * Se non fornito, usa window per lo scroll dell'intera pagina.
   * Passa il ref del div che ha overflow-y: auto/scroll
   */
  scrollContainerRef?: React.RefObject<HTMLElement | null>
  /** 
   * Tipo di posizionamento: 'fixed' per pagina intera, 'absolute' per contenitori
   */
  positionType?: 'fixed' | 'absolute'
}

export function BackToTop({
  threshold = 300,
  position = 'right',
  bottomOffset = '2rem',
  sideOffset = '2rem',
  className,
  variant = 'default',
  size = 'icon',
  scrollDuration = 500,
  scrollContainerRef,
  positionType = 'fixed',
}: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Controlla la posizione dello scroll
  const checkScroll = useCallback(() => {
    if (scrollContainerRef?.current) {
      // Scroll all'interno di un contenitore specifico
      const scrollTop = scrollContainerRef.current.scrollTop
      setIsVisible(scrollTop > threshold)
    } else {
      // Scroll della finestra
      const scrollY = window.scrollY || document.documentElement.scrollTop
      setIsVisible(scrollY > threshold)
    }
  }, [threshold, scrollContainerRef])

  useEffect(() => {
    const container = scrollContainerRef?.current

    if (container) {
      // Ascolta lo scroll del contenitore
      container.addEventListener('scroll', checkScroll, { passive: true })
    } else {
      // Ascolta lo scroll della finestra
      window.addEventListener('scroll', checkScroll, { passive: true })
    }

    // Controllo iniziale
    checkScroll()

    return () => {
      if (container) {
        container.removeEventListener('scroll', checkScroll)
      } else {
        window.removeEventListener('scroll', checkScroll)
      }
    }
  }, [checkScroll, scrollContainerRef])

  // Funzione per tornare all'inizio con animazione smooth
  const scrollToTop = () => {
    const container = scrollContainerRef?.current
    const startPosition = container ? container.scrollTop : window.scrollY
    const startTime = performance.now()

    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / scrollDuration, 1)
      const easeProgress = easeOutCubic(progress)
      const newPosition = startPosition * (1 - easeProgress)

      if (container) {
        container.scrollTop = newPosition
      } else {
        window.scrollTo({
          top: newPosition,
          behavior: 'auto' // Usiamo la nostra animazione
        })
      }

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={scrollToTop}
      className={cn(
        'z-50 transition-all duration-300 ease-in-out shadow-lg',
        positionType,
        isVisible 
          ? 'opacity-100 translate-y-0 scale-100' 
          : 'opacity-0 translate-y-4 scale-95 pointer-events-none',
        position === 'right' ? 'right-4' : 'left-4',
        className
      )}
      style={{
        bottom: bottomOffset,
        [position === 'right' ? 'right' : 'left']: sideOffset,
      }}
      aria-label="Torna all'inizio"
    >
      <ArrowUp className="size-5" />
    </Button>
  )
}

/**
 * Hook di utilità per creare un ref per il contenitore scrollabile
 * e passarlo facilmente al componente BackToTop
 * 
 * @example
 * const [scrollRef, ScrollContainer] = useScrollContainer()
 * 
 * return (
 *   <div className="flex flex-col h-screen">
 *     <header>Fisso</header>
 *     <ScrollContainer className="flex-1 overflow-y-auto">
 *       {/* Contenuto *\/}
 *     </ScrollContainer>
 *     <BackToTop scrollContainerRef={scrollRef} positionType="absolute" />
 *   </div>
 * )
 */
export function useScrollContainer() {
  const ref = useRef<HTMLDivElement>(null)
  
  const ScrollContainer = ({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
    <div ref={ref} className={className} {...props}>
      {children}
    </div>
  )
  
  return [ref, ScrollContainer] as const
}
