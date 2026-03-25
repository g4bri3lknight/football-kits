'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shirt, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Kit, Player } from '@/types';

interface TimelineDialogProps {
  open: boolean;
  onClose: () => void;
  onKitClick: (kit: Kit, player: Player) => void;
}

// Tipo per i kit dalla API timeline
interface TimelineKit {
  id: string;
  name: string;
  team: string;
  type: string;
  hasImage: boolean;
  hasLogo: boolean;
  updatedAt: string;
  player: {
    id: string;
    name: string;
    surname: string | null;
  };
  playerKitId: string;
}

interface YearGroup {
  year: string;
  kits: TimelineKit[];
}

// Helper per ottenere il nome visualizzato del giocatore
const getPlayerDisplayName = (player: TimelineKit['player']): string => {
  return `${player.name} ${player.surname || ''}`.trim();
};

// Helper per ottenere l'URL dell'immagine
const getKitImageUrl = (kitId: string, type: 'image' | 'logo', updatedAt?: string) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/kits/${kitId}/${type}${cacheBuster}`;
};

export function TimelineDialog({ open, onClose, onKitClick }: TimelineDialogProps) {
  const [timelineData, setTimelineData] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isScrollingRef = useRef(false);

  useEffect(() => {
    if (open) {
      fetchTimelineData();
    }
  }, [open]);

  // Aggiorna selectedYear durante lo scroll
  useEffect(() => {
    if (!open || loading || timelineData.length === 0 || viewMode !== 'timeline') return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Ignora se lo scroll è programmato da un click
      if (isScrollingRef.current) return;

      const containerRect = container.getBoundingClientRect();
      // La soglia è 0: il tasto cambia solo quando la sezione precedente è uscita completamente dalla vista superiore
      const topThreshold = 0;

      // Trova la prima sezione che è ancora visibile (la cui parte superiore è sotto la soglia)
      let activeYear: string | null = null;

      for (const group of timelineData) {
        const element = document.getElementById(`year-${group.year}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          
          // Se la sezione è ancora visibile (non è ancora scorsa via)
          if (relativeTop < topThreshold) {
            activeYear = group.year;
          }
        }
      }

      if (activeYear && activeYear !== selectedYear) {
        setSelectedYear(activeYear);
      }
    };

    container.addEventListener('scroll', handleScroll);
    // Esegui una volta all'inizio
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [open, loading, timelineData, viewMode, selectedYear]);

  // Scrolla il tasto della stagione selezionata nella barra di navigazione
  useEffect(() => {
    if (!selectedYear) return;
    const button = document.getElementById(`btn-${selectedYear}`);
    if (button) {
      button.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [selectedYear]);

  const fetchTimelineData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/timeline');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setTimelineData(data);
        if (data.length > 0 && !selectedYear) {
          setSelectedYear(data[0].year);
        }
      }
    } catch (error) {
      console.error('Error fetching timeline data:', error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToYear = (year: string) => {
    setSelectedYear(year);
    isScrollingRef.current = true;
    const element = document.getElementById(`year-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // Rileva quando lo scroll è terminato controllando se la posizione è stabile
    const container = scrollContainerRef.current;
    if (container) {
      let lastScrollTop = container.scrollTop;
      let stableCount = 0;
      
      const checkScrollEnd = () => {
        const currentScrollTop = container.scrollTop;
        if (currentScrollTop === lastScrollTop) {
          stableCount++;
          // Se la posizione è stabile per 5 check consecutivi (250ms), lo scroll è terminato
          if (stableCount >= 5) {
            isScrollingRef.current = false;
            return;
          }
        } else {
          stableCount = 0;
          lastScrollTop = currentScrollTop;
        }
        requestAnimationFrame(checkScrollEnd);
      };
      
      requestAnimationFrame(checkScrollEnd);
    }
  };

  const handleKitClick = useCallback((kit: TimelineKit) => {
    // Converte il kit nel formato atteso da onKitClick
    const kitData: Kit = {
      id: kit.id,
      name: kit.name,
      team: kit.team,
      type: kit.type,
      hasImage: kit.hasImage,
      hasLogo: kit.hasLogo,
      updatedAt: new Date(kit.updatedAt),
      createdAt: new Date(kit.updatedAt),
      status: 'NON_IMPOSTATO',
      hasModel3D: false,
      hasDetail1: false,
      hasDetail2: false,
      hasDetail3: false,
      hasDetail4: false,
      hasDetail5: false,
      hasDetail6: false,
      likes: 0,
      dislikes: 0,
    };
    
    const playerData: Player = {
      id: kit.player.id,
      name: kit.player.name,
      surname: kit.player.surname,
      hasImage: false,
      updatedAt: new Date(),
      createdAt: new Date(),
      status: 'NON_IMPOSTATO',
      PlayerKit: [],
    };
    
    onKitClick(kitData, playerData);
    onClose();
  }, [onKitClick, onClose]);

  // Statistiche
  const totalKits = timelineData.reduce((sum, group) => sum + group.kits.length, 0);
  const totalYears = timelineData.length;
  const yearRange = timelineData.length > 0 
    ? `${timelineData[timelineData.length - 1]?.year} - ${timelineData[0]?.year}`
    : '';

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="w-[90vw] max-w-[1400px] max-h-[90vh] flex flex-col p-0 pb-2 gap-0 dialog-custom-color border-2">
        {/* Header */}
        <DialogHeader className="px-4 py-3 border-b shrink-0">
          <div className="flex items-center justify-between pr-10">
            <DialogTitle className="flex items-center gap-2 text-xl">
              <Clock className="w-5 h-5" />
              Timeline Storica
            </DialogTitle>
          </div>
          
          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 mt-2">
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Shirt className="w-4 h-4" />
              {totalKits} kit
            </span>
            <span className="flex items-center gap-1 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              {totalYears} stagioni
            </span>
            {yearRange && (
              <span className="hidden sm:inline text-sm text-muted-foreground">
                {yearRange}
              </span>
            )}
            
            {/* Toggle view mode */}
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                onClick={() => setViewMode('timeline')}
                className="h-7 px-3 text-xs"
              >
                Timeline
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="h-7 px-3 text-xs"
              >
                Griglia
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Year navigation */}
        {timelineData.length > 0 && (
          <div className="w-full border-b bg-muted/30 shrink-0 overflow-x-auto">
            <div className="flex items-center gap-1 px-4 py-2">
              {timelineData.map((group) => (
                <Button
                  key={group.year}
                  id={`btn-${group.year}`}
                  variant={selectedYear === group.year ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => scrollToYear(group.year)}
                  className={`shrink-0 h-8 px-3 text-xs font-medium transition-all ${
                    selectedYear === group.year 
                      ? 'bg-[#cd2127] hover:bg-[#b01d23] text-white border-[#cd2127]' 
                      : ''
                  }`}
                >
                  {group.year}
                  <Badge variant="secondary" className="ml-1.5 h-4 px-1 text-[10px]">
                    {group.kits.length}
                  </Badge>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div ref={scrollContainerRef} className="flex-1 min-h-0 w-full overflow-y-auto [scrollbar-width:auto] [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-[#002f42] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#cd2127]">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-[#002f42] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-muted-foreground">Caricamento timeline...</p>
              </div>
            </div>
          ) : timelineData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Nessun kit disponibile</h3>
              <p className="text-muted-foreground">Aggiungi dei kit con anno per vedere la timeline</p>
            </div>
          ) : viewMode === 'timeline' ? (
            /* Timeline View */
            <div className="relative px-6 py-6">
              {/* Timeline line */}
              <div className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#002f42] via-[#cd2127] to-[#002f42]" />

              {timelineData.map((group) => (
                <div
                  key={group.year}
                  id={`year-${group.year}`}
                  className="relative mb-8 last:mb-0 scroll-mt-4"
                >
                  {/* Year marker */}
                  <div className="flex items-center gap-4 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 -ml-1">
                    <div className="relative z-10 w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#002f42] to-[#004d6d] flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-background">
                      {group.year}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground">Stagione {group.year}</h3>
                      <p className="text-sm text-muted-foreground">
                        {group.kits.length} kit{group.kits.length > 1 ? ' disponibili' : ' disponibile'}
                      </p>
                    </div>
                  </div>

                  {/* Kits grid for this year */}
                  <div className="ml-[68px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    {group.kits.map((kit, kitIndex) => (
                      <motion.div
                        key={kit.playerKitId}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: kitIndex * 0.03 }}
                        className="group"
                      >
                        <button
                          onClick={() => handleKitClick(kit)}
                          className="w-full bg-card border-2 border-transparent hover:border-[#cd2127] rounded-lg overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
                        >
                          {/* Kit image */}
                          <div className="aspect-square bg-muted relative overflow-hidden">
                            {kit.hasImage ? (
                              <img
                                src={getKitImageUrl(kit.id, 'image', kit.updatedAt)}
                                alt={kit.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : kit.hasLogo ? (
                              <img
                                src={getKitImageUrl(kit.id, 'logo', kit.updatedAt)}
                                alt={kit.name}
                                className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                                <Shirt className="w-8 h-8 text-muted-foreground/40" />
                              </div>
                            )}
                            
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-white text-xs font-medium truncate">
                                  {kit.team || kit.name}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Info */}
                          <div className="p-2 space-y-1">
                            <p className="text-xs font-medium truncate text-foreground">
                              {getPlayerDisplayName(kit.player)}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {kit.name}
                            </p>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Grid View */
            <div className="p-6">
              {selectedYear ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                  {timelineData
                    .find(g => g.year === selectedYear)
                    ?.kits.map((kit, kitIndex) => (
                      <motion.div
                        key={kit.playerKitId}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: kitIndex * 0.02 }}
                        className="group"
                      >
                        <button
                          onClick={() => handleKitClick(kit)}
                          className="w-full bg-card border-2 border-transparent hover:border-[#cd2127] rounded-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer"
                        >
                          <div className="aspect-square bg-muted relative overflow-hidden">
                            {kit.hasImage ? (
                              <img
                                src={getKitImageUrl(kit.id, 'image', kit.updatedAt)}
                                alt={kit.name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : kit.hasLogo ? (
                              <img
                                src={getKitImageUrl(kit.id, 'logo', kit.updatedAt)}
                                alt={kit.name}
                                className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Shirt className="w-8 h-8 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="p-2">
                            <p className="text-xs font-medium truncate">
                              {getPlayerDisplayName(kit.player)}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {kit.team || kit.name}
                            </p>
                          </div>
                        </button>
                      </motion.div>
                    ))}
                </div>
              ) : (
                timelineData.map((group) => (
                  <div key={group.year} className="mb-6">
                    <h3 className="text-lg font-bold mb-3 sticky top-0 bg-background py-2">
                      {group.year}
                    </h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                      {group.kits.map((kit) => (
                        <button
                          key={kit.playerKitId}
                          onClick={() => handleKitClick(kit)}
                          className="bg-card border rounded-lg overflow-hidden hover:border-[#cd2127] transition-all cursor-pointer"
                        >
                          <div className="aspect-square bg-muted relative">
                            {kit.hasImage ? (
                              <img
                                src={getKitImageUrl(kit.id, 'image', kit.updatedAt)}
                                alt={kit.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Shirt className="w-6 h-6 text-muted-foreground/40" />
                              </div>
                            )}
                          </div>
                          <div className="p-1.5">
                            <p className="text-[10px] font-medium truncate">
                              {getPlayerDisplayName(kit.player)}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
