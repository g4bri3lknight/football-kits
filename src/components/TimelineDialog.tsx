'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FramerDialog } from '@/components/ui/framer-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Shirt, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { Kit, Player } from '@/types';
import { TimelineSkeleton } from '@/components/ui/skeleton-shimmer';

interface TimelineDialogProps {
  open: boolean;
  onClose: () => void;
  onKitClick: (kit: Kit, player: Player) => void;
}

interface TimelineKit {
  id: string;
  name: string;
  team: string;
  type: string;
  hasImage: boolean;
  hasLogo: boolean;
  hasModel3D: boolean;
  hasDetail1: boolean;
  hasDetail2: boolean;
  hasDetail3: boolean;
  hasDetail4: boolean;
  hasDetail5: boolean;
  hasDetail6: boolean;
  detail1Label: string | null;
  detail2Label: string | null;
  detail3Label: string | null;
  detail4Label: string | null;
  detail5Label: string | null;
  detail6Label: string | null;
  status: string;
  likes: number;
  dislikes: number;
  updatedAt: string;
  player: {
    id: string;
    name: string;
    surname: string | null;
    hasImage: boolean;
  status: string;
  biography: string | null;
  nationId: string | null;
  Nation?: {
    id: string;
    name: string;
    code: string;
    flag: string | null;
  } | null;
  };
  playerKitId: string;
}

interface YearGroup {
  year: string;
  kits: TimelineKit[];
}

const getPlayerDisplayName = (player: TimelineKit['player']): string => {
  return `${player.name} ${player.surname || ''}`.trim();
};

const getKitImageUrl = (kitId: string, type: 'image' | 'logo', updatedAt?: string) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/kits/${kitId}/${type}${cacheBuster}`;
};

// Animation variants for internal content
const headerVariants = {
  hidden: { opacity: 0, y: -20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 350, damping: 30, delay: 0.1 }
  }
};

const statsVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.2 }
  }
};

const statItemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 25 } }
};

const yearNavVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { staggerChildren: 0.03, delayChildren: 0.3 }
  }
};

const yearButtonVariants = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: { 
    opacity: 1, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  }
};

const yearGroupVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const yearMarkerVariants = {
  hidden: { opacity: 0, scale: 0, rotate: -180 },
  visible: { 
    opacity: 1, 
    scale: 1, 
    rotate: 0,
    transition: { type: 'spring', stiffness: 300, damping: 20 }
  }
};

const kitCardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 350, damping: 25 }
  }
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

  useEffect(() => {
    if (!open || loading || timelineData.length === 0 || viewMode !== 'timeline') return;

    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isScrollingRef.current) return;

      const containerRect = container.getBoundingClientRect();
      const topThreshold = 0;
      let activeYear: string | null = null;

      for (const group of timelineData) {
        const element = document.getElementById(`year-${group.year}`);
        if (element) {
          const rect = element.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
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
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [open, loading, timelineData, viewMode, selectedYear]);

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
    
    const container = scrollContainerRef.current;
    if (container) {
      let lastScrollTop = container.scrollTop;
      let stableCount = 0;
      
      const checkScrollEnd = () => {
        const currentScrollTop = container.scrollTop;
        if (currentScrollTop === lastScrollTop) {
          stableCount++;
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
    const kitData: Kit = {
      id: kit.id,
      name: kit.name,
      team: kit.team,
      type: kit.type,
      hasImage: kit.hasImage,
      hasLogo: kit.hasLogo,
      hasModel3D: kit.hasModel3D,
      hasDetail1: kit.hasDetail1,
      hasDetail2: kit.hasDetail2,
      hasDetail3: kit.hasDetail3,
      hasDetail4: kit.hasDetail4,
      hasDetail5: kit.hasDetail5,
      hasDetail6: kit.hasDetail6,
      detail1Label: kit.detail1Label,
      detail2Label: kit.detail2Label,
      detail3Label: kit.detail3Label,
      detail4Label: kit.detail4Label,
      detail5Label: kit.detail5Label,
      detail6Label: kit.detail6Label,
      status: kit.status as 'NON_IMPOSTATO' | 'NUOVO' | 'AGGIORNATO',
      likes: kit.likes,
      dislikes: kit.dislikes,
      updatedAt: new Date(kit.updatedAt),
      createdAt: new Date(kit.updatedAt),
    };
    
    const playerData: Player = {
      id: kit.player.id,
      name: kit.player.name,
      surname: kit.player.surname,
      hasImage: kit.player.hasImage,
      status: kit.player.status as 'NON_IMPOSTATO' | 'NUOVO' | 'AGGIORNATO',
      biography: kit.player.biography,
      nationId: kit.player.nationId,
      Nation: kit.player.Nation,
      updatedAt: new Date(),
      createdAt: new Date(),
      PlayerKit: [],
    };
    
    onKitClick(kitData, playerData);
    // Non chiudere la timeline - resta aperta sotto il KitDialog
  }, [onKitClick]);

  const totalKits = timelineData.reduce((sum, group) => sum + group.kits.length, 0);
  const totalYears = timelineData.length;
  const yearRange = timelineData.length > 0 
    ? `${timelineData[timelineData.length - 1]?.year} - ${timelineData[0]?.year}`
    : '';

  return (
    <FramerDialog open={open} onOpenChange={() => onClose()} className="w-[90vw] max-w-[1400px] max-h-[90vh] flex flex-col p-0 pb-2 gap-0 dialog-custom-color border-2">
              {/* Header */}
              <DialogHeader className="px-4 py-3 border-b shrink-0">
                <motion.div variants={headerVariants} initial="hidden" animate="visible" className="flex items-center justify-between pr-10">
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    >
                      <Clock className="w-5 h-5" />
                    </motion.div>
                    Timeline Storica
                  </DialogTitle>
                </motion.div>
                
                {/* Stats row */}
                <motion.div 
                  variants={statsVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex items-center justify-center gap-6 mt-2"
                >
                  <motion.span variants={statItemVariants} className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Shirt className="w-4 h-4" />
                    {totalKits} kit
                  </motion.span>
                  <motion.span variants={statItemVariants} className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {totalYears} stagioni
                  </motion.span>
                  {yearRange && (
                    <motion.span variants={statItemVariants} className="hidden sm:inline text-sm text-muted-foreground">
                      {yearRange}
                    </motion.span>
                  )}
                  
                  {/* Toggle view mode */}
                  <motion.div variants={statItemVariants} className="flex items-center gap-1 bg-muted rounded-lg p-1">
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
                  </motion.div>
                </motion.div>
              </DialogHeader>

              {/* Year navigation */}
              {timelineData.length > 0 && (
                <motion.div 
                  variants={yearNavVariants}
                  initial="hidden"
                  animate="visible"
                  className="w-full border-b bg-muted/30 shrink-0 overflow-x-auto"
                >
                  <div className="flex items-center gap-1 px-4 py-2">
                    {timelineData.map((group) => (
                      <motion.div key={group.year} variants={yearButtonVariants}>
                        <Button
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
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Main content */}
              <div ref={scrollContainerRef} className="flex-1 min-h-0 w-full overflow-y-auto [scrollbar-width:auto] [&::-webkit-scrollbar]:w-3.5 [&::-webkit-scrollbar-track]:bg-muted [&::-webkit-scrollbar-thumb]:bg-[#002f42] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb:hover]:bg-[#cd2127]">
                {loading ? (
                  <div className="p-6">
                    <TimelineSkeleton />
                  </div>
                ) : timelineData.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-full text-center p-8"
                  >
                    <motion.div
                      animate={{ 
                        rotate: [0, 10, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Nessun kit disponibile</h3>
                    <p className="text-muted-foreground">Aggiungi dei kit con anno per vedere la timeline</p>
                  </motion.div>
                ) : viewMode === 'timeline' ? (
                  /* Timeline View */
                  <div className="relative px-6 py-6">
                    {/* Timeline line */}
                    <motion.div 
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                      className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#002f42] via-[#cd2127] to-[#002f42] origin-top"
                    />

                    {timelineData.map((group, groupIndex) => (
                      <motion.div
                        key={group.year}
                        variants={yearGroupVariants}
                        initial="hidden"
                        animate="visible"
                        id={`year-${group.year}`}
                        className="relative mb-8 last:mb-0 scroll-mt-4"
                      >
                        {/* Year marker */}
                        <motion.div 
                          variants={yearMarkerVariants}
                          className="flex items-center gap-4 mb-4 sticky top-0 bg-background/95 backdrop-blur-sm py-2 z-10 -ml-1"
                        >
                          <motion.div 
                            whileHover={{ scale: 1.1, rotate: 5 }}
                            className="relative z-10 w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#002f42] to-[#004d6d] flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-background"
                          >
                            {group.year}
                          </motion.div>
                          <div>
                            <h3 className="text-lg font-bold text-foreground">Stagione {group.year}</h3>
                            <p className="text-sm text-muted-foreground">
                              {group.kits.length} kit{group.kits.length > 1 ? ' disponibili' : ' disponibile'}
                            </p>
                          </div>
                        </motion.div>

                        {/* Kits grid for this year */}
                        <div className="ml-[68px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {group.kits.map((kit, kitIndex) => (
                            <motion.div
                              key={kit.playerKitId}
                              variants={kitCardVariants}
                              transition={{ delay: kitIndex * 0.02 }}
                              className="group"
                              whileHover={{ scale: 1.05, y: -5 }}
                            >
                              <button
                                onClick={() => handleKitClick(kit)}
                                className="w-full bg-card border-2 border-transparent hover:border-[#cd2127] rounded-lg overflow-hidden transition-all hover:shadow-xl cursor-pointer"
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
                                  <motion.div 
                                    initial={{ opacity: 0 }}
                                    whileHover={{ opacity: 1 }}
                                    className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <div className="absolute bottom-0 left-0 right-0 p-2">
                                      <p className="text-white text-xs font-medium truncate">
                                        {kit.team || kit.name}
                                      </p>
                                    </div>
                                  </motion.div>
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
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  /* Grid View */
                  <div className="p-6">
                    {selectedYear ? (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3"
                      >
                        {timelineData
                          .find(g => g.year === selectedYear)
                          ?.kits.map((kit, kitIndex) => (
                            <motion.div
                              key={kit.playerKitId}
                              variants={kitCardVariants}
                              initial="hidden"
                              animate="visible"
                              transition={{ delay: kitIndex * 0.02 }}
                              className="group"
                              whileHover={{ scale: 1.05, y: -5 }}
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
                      </motion.div>
                    ) : (
                      timelineData.map((group) => (
                        <motion.div 
                          key={group.year} 
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mb-6"
                        >
                          <h3 className="text-lg font-bold mb-3 sticky top-0 bg-background py-2">
                            {group.year}
                          </h3>
                          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                            {group.kits.map((kit, kitIndex) => (
                              <motion.div
                                key={kit.playerKitId}
                                variants={kitCardVariants}
                                initial="hidden"
                                animate="visible"
                                transition={{ delay: kitIndex * 0.01 }}
                                whileHover={{ scale: 1.05 }}
                              >
                                <button
                                  onClick={() => handleKitClick(kit)}
                                  className="w-full bg-card border rounded-lg overflow-hidden hover:border-[#cd2127] transition-all cursor-pointer"
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
                              </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                )}
              </div>
    </FramerDialog>
  );
}
