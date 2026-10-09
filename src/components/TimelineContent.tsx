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
  League?: {
    id: string;
    name: string;
    season: string;
    nation: string;
    hasLogo: boolean;
    updatedAt?: string;
  } | null;
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
  // Stagione la cui intestazione è attualmente agganciata (sticky) in alto
  const [stuckYear, setStuckYear] = useState<string | null>(null);
  // Spazio in fondo alla timeline: permette all'ultima stagione (spesso corta) di arrivare in cima
  const [tailPad, setTailPad] = useState(0);
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
      const containerRect = container.getBoundingClientRect();

      // Intestazione agganciata (16px sotto il bordo alto, per non tagliare il cerchio): la sezione ha raggiunto quella soglia ma non è ancora finita
      let stuck: string | null = null;
      for (const group of timelineData) {
        const element = document.getElementById(`timeline-year-${group.year}`);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        if (rect.top - containerRect.top < 15 && rect.bottom - containerRect.top > 90) {
          stuck = group.year;
        }
      }
      setStuckYear((prev) => (prev === stuck ? prev : stuck));

      if (isProgrammaticScrollRef.current) return;

      const topThreshold = 10;
      let activeYear: string | null = null;

      for (const group of timelineData) {
        const element = document.getElementById(`timeline-year-${group.year}`);
        if (element) {
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

  // Calcola lo spazio in fondo così anche l'ultima stagione può agganciarsi in alto
  useEffect(() => {
    if (loading || timelineData.length === 0 || viewMode !== 'timeline') return;
    const container = scrollRef.current;
    const last = document.getElementById(`timeline-year-${timelineData[timelineData.length - 1].year}`);
    if (!container || !last) return;

    const measure = () => {
      setTailPad(Math.max(0, Math.round(container.clientHeight - last.offsetHeight - 48)));
    };
    measure();

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : null;
    ro?.observe(container);
    ro?.observe(last);
    window.addEventListener('resize', measure);
    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [loading, timelineData, viewMode]);

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
      detail1Label: kit.detail1Label ?? undefined,
      detail2Label: kit.detail2Label ?? undefined,
      detail3Label: kit.detail3Label ?? undefined,
      detail4Label: kit.detail4Label ?? undefined,
      detail5Label: kit.detail5Label ?? undefined,
      detail6Label: kit.detail6Label ?? undefined,
      status: kit.status as 'NON_IMPOSTATO' | 'NUOVO' | 'AGGIORNATO',
      likes: kit.likes,
      dislikes: kit.dislikes,
      updatedAt: new Date(kit.updatedAt),
      createdAt: new Date(kit.updatedAt),
      League: kit.League ?? null,
    };

    const playerData: Player = {
      id: kit.player.id,
      name: kit.player.name,
      surname: kit.player.surname ?? undefined,
      hasImage: kit.player.hasImage,
      status: kit.player.status as 'NON_IMPOSTATO' | 'NUOVO' | 'AGGIORNATO',
      biography: kit.player.biography ?? undefined,
      nationId: kit.player.nationId ?? undefined,
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

  // Decenni (dalla prima parte della stagione, es. "2010/2011" -> 2010) per il salto rapido
  const decades: { decade: number; firstYear: string; count: number }[] = [];
  let decadesValid = true;
  for (const group of timelineData) {
    const y = parseInt(group.year, 10);
    if (Number.isNaN(y)) {
      decadesValid = false;
      break;
    }
    const decade = Math.floor(y / 10) * 10;
    const existing = decades.find((d) => d.decade === decade);
    if (existing) existing.count += 1;
    else decades.push({ decade, firstYear: group.year, count: 1 });
  }
  const selectedDecade = selectedYear ? Math.floor(parseInt(selectedYear, 10) / 10) * 10 : null;

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Panel - static at top, NOT inside scroll area */}
      <div
        ref={panelRef}
        className="shrink-0 rounded-lg mx-2 mt-2 border border-white/10 overflow-hidden"
      >
        <div className="gk-on-green gk-panel bg-black/80 backdrop-blur-xl">
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
              {decadesValid && decades.length > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2">
                  <span className="shrink-0 mr-1 text-[11px] uppercase tracking-wider text-white/55">
                    Salta a
                  </span>
                  {decades.map((d) => (
                    <button
                      key={d.decade}
                      onClick={() => scrollToYear(d.firstYear)}
                      className={`shrink-0 h-7 px-3 text-xs font-semibold rounded-full border transition-all cursor-pointer ${
                        selectedDecade === d.decade
                          ? 'bg-[#0a6a8c] text-white border-white'
                          : 'bg-black/60 text-white border-white/20 hover:bg-white/10'
                      }`}
                    >
                      Anni {d.decade} · {d.count} {d.count === 1 ? 'stagione' : 'stagioni'}
                    </button>
                  ))}
                </div>
              )}
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
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 py-6 px-4">
        <div className="container mx-auto">
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
          <div className="relative z-0 px-2 pt-4" style={{ paddingBottom: 16 + tailPad }}>
            {/* Timeline line (petrolio -> rosso, come il logo) */}
            <div className="absolute left-[38px] md:left-[50px] top-0 bottom-0 w-1 rounded-full bg-gradient-to-b from-[#0f7b9f] via-[#cd2127] to-[#0f7b9f] shadow-[0_0_0_1.5px_rgba(0,0,0,0.55),0_0_14px_rgba(205,33,39,0.45)]" />

            {timelineData.map((group) => (
              <div
                key={group.year}
                id={`timeline-year-${group.year}`}
                className="gk-on-green relative isolate z-0 mb-7 last:mb-0 ml-12 md:ml-[76px] px-3 md:px-4 pb-3 md:pb-4"
                style={{ scrollMarginTop: '16px' }}
              >
                {/* Sfondo del pannello: nero 80% + blur forte (come il resto dell'app) */}
                <div
                  aria-hidden
                  className="gk-panel-bg absolute inset-0 -z-10 rounded-2xl bg-black/80 backdrop-blur-xl border border-white/10"
                />

                {/* Intestazione stagione (sticky) con cerchio dell'anno */}
                <div
                  className={`gk-keepgreen sticky -top-2 z-20 -mx-3 md:-mx-4 mb-3 px-3 md:px-4 py-3 rounded-t-2xl border-b border-white/10 backdrop-blur-xl transition-colors ${
                    stuckYear === group.year ? 'bg-black/80' : 'bg-transparent'
                  }`}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -left-12 md:-left-[76px] w-16 h-16 md:w-[88px] md:h-[88px] rounded-full bg-gradient-to-br from-[#00394f] to-[#0a6a8c] flex items-center justify-center px-1 text-center leading-tight text-white font-bold text-[11px] md:text-sm shadow-[0_0_0_4px_rgba(0,0,0,0.65),0_0_0_6px_#cd2127,0_6px_18px_rgba(0,0,0,0.6)]">
                    {group.year}
                  </div>
                  <div className="pl-5 md:pl-[30px]">
                    <h3 className="text-lg font-bold text-white">Stagione {group.year}</h3>
                    <p className="text-sm text-white/80">
                      {group.kits.length} kit{group.kits.length > 1 ? ' disponibili' : ' disponibile'}
                    </p>
                  </div>
                </div>

                {/* Kits grid for this year */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
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
    </div>
  );
}
