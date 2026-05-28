'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Calendar, Shirt, Clock } from 'lucide-react';
import { Kit, Player } from '@/types';
import { TimelineSkeleton } from '@/components/ui/skeleton-shimmer';

interface TimelineContentProps {
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

export function TimelineContent({ onKitClick }: TimelineContentProps) {
  const [timelineData, setTimelineData] = useState<YearGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');
  const isProgrammaticScrollRef = useRef(false);
  const programmaticScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTimelineData();
  }, []);

  // Track which year is visible based on scroll inside the internal scroll container
  useEffect(() => {
    if (loading || timelineData.length === 0 || viewMode !== 'timeline') return;

    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (isProgrammaticScrollRef.current) return;

      const topThreshold = 10;
      let activeYear: string | null = null;

      for (const group of timelineData) {
        const element = document.getElementById(`timeline-year-${group.year}`);
        if (element) {
          const containerRect = container.getBoundingClientRect();
          const elementRect = element.getBoundingClientRect();
          const relativeTop = elementRect.top - containerRect.top;
          if (relativeTop < topThreshold) {
            activeYear = group.year;
          }
        }
      }

      if (activeYear && activeYear !== selectedYear) {
        setSelectedYear(activeYear);
      }
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => container.removeEventListener('scroll', handleScroll);
  }, [loading, timelineData, viewMode, selectedYear]);

  // Auto-scroll the year nav button into view
  useEffect(() => {
    if (!selectedYear || isProgrammaticScrollRef.current) return;
    const button = document.getElementById(`timeline-btn-${selectedYear}`);
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
    isProgrammaticScrollRef.current = true;
    setSelectedYear(year);
    
    const element = document.getElementById(`timeline-year-${year}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (programmaticScrollTimerRef.current) {
      clearTimeout(programmaticScrollTimerRef.current);
    }

    programmaticScrollTimerRef.current = setTimeout(() => {
      isProgrammaticScrollRef.current = false;
      programmaticScrollTimerRef.current = null;
    }, 1200);
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
  }, [onKitClick]);

  const totalKits = timelineData.reduce((sum, group) => sum + group.kits.length, 0);
  const totalYears = timelineData.length;
  const yearRange = timelineData.length > 0
    ? `${timelineData[timelineData.length - 1]?.year} - ${timelineData[0]?.year}`
    : '';

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Panel - static at top, NOT inside scroll area */}
      <div
        ref={panelRef}
        className="shrink-0 rounded-lg mx-2 mt-2 border border-white/10 overflow-hidden"
      >
        <div className="bg-black/70 backdrop-blur-md">
          {/* Stats row */}
          <div className="flex items-center justify-center gap-6 py-2 px-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <Shirt className="w-4 h-4" />
              {totalKits} kit
            </span>
            <span className="flex items-center gap-1.5 text-sm font-semibold text-white">
              <Calendar className="w-4 h-4" />
              {totalYears} stagioni
            </span>
            {yearRange && (
              <span className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-white">
                <Clock className="w-4 h-4" />
                {yearRange}
              </span>
            )}

            {/* Toggle view mode */}
            <div className="flex items-center gap-1 bg-black/60 rounded-lg p-1">
              <button
                onClick={() => setViewMode('timeline')}
                className={`h-7 px-3 text-xs font-medium rounded-lg transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-[#002f42] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`h-7 px-3 text-xs font-medium rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-[#002f42] text-white shadow-sm'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                Griglia
              </button>
            </div>
          </div>

          {/* Year navigation - attached to stats row */}
          {timelineData.length > 0 && (
            <div className="border-t border-white/10 px-3 py-2">
              <div className="overflow-x-auto pb-2">
                <div className="flex items-center gap-1.5">
                  {timelineData.map((group) => (
                    <button
                      key={group.year}
                      id={`timeline-btn-${group.year}`}
                      onClick={() => scrollToYear(group.year)}
                      className={`shrink-0 h-8 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer border ${
                        selectedYear === group.year
                          ? 'bg-[#cd2127] hover:bg-[#b01d23] text-white border-[#cd2127]'
                          : 'bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white'
                      }`}
                    >
                      {group.year}
                      <span className="ml-1.5 inline-flex items-center justify-center h-4 px-1 text-[10px] bg-white/20 text-white rounded">
                        {group.kits.length}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll container for season content - starts BELOW the panel */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 container mx-auto px-4 py-6">
        {loading ? (
          <div className="p-6">
            <TimelineSkeleton />
          </div>
        ) : timelineData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-center p-8">
            <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nessun kit disponibile</h3>
            <p className="text-muted-foreground">Aggiungi dei kit con anno per vedere la timeline</p>
          </div>
        ) : viewMode === 'timeline' ? (
          /* Timeline View */
          <div className="relative z-0 px-2 py-4">
            {/* Timeline line */}
            <div className="absolute left-[29px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#002f42] via-[#cd2127] to-[#002f42]" />

            {timelineData.map((group) => (
              <div
                key={group.year}
                id={`timeline-year-${group.year}`}
                className="relative z-0 mb-8 last:mb-0"
                style={{ scrollMarginTop: '16px' }}
              >
                {/* Year marker */}
                <div className="flex items-center gap-4 mb-4 -ml-1">
                  <div className="relative w-[60px] h-[60px] rounded-full bg-gradient-to-br from-[#002f42] to-[#004d6d] flex items-center justify-center text-white font-bold text-sm shadow-lg ring-4 ring-black/40">
                    {group.year}
                  </div>
                  <div className="bg-black/70 backdrop-blur-md rounded-lg px-3 py-1.5">
                    <h3 className="text-lg font-bold text-white">Stagione {group.year}</h3>
                    <p className="text-sm text-white/80">
                      {group.kits.length} kit{group.kits.length > 1 ? ' disponibili' : ' disponibile'}
                    </p>
                  </div>
                </div>

                {/* Kits grid for this year */}
                <div className="ml-[68px] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                  {group.kits.map((kit) => (
                    <div key={kit.playerKitId} className="group">
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
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted/50">
                              <Shirt className="w-8 h-8 text-muted-foreground/40" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="absolute bottom-0 left-0 right-0 p-2">
                              <p className="text-white text-xs font-medium truncate">
                                {kit.team || kit.name}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="p-2 space-y-1">
                          <p className="text-xs font-medium truncate text-foreground">
                            {getPlayerDisplayName(kit.player)}
                          </p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {kit.name}
                          </p>
                        </div>
                      </button>
                    </div>
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
                  ?.kits.map((kit) => (
                    <div key={kit.playerKitId} className="group">
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
                    </div>
                  ))}
              </div>
            ) : (
              timelineData.map((group) => (
                <div key={group.year} className="mb-6">
                  <h3 className="text-lg font-bold mb-3 text-white py-2">
                    {group.year}
                  </h3>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {group.kits.map((kit) => (
                      <div key={kit.playerKitId} className="group">
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
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
