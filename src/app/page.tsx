'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Search, User as UserIcon, Menu, Clock, SlidersHorizontal, X } from 'lucide-react';
import Flag from 'react-world-flags';

import { Nation, Player, Kit, PlayerKit } from '@/types';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';
import { sortKitsBySeason, filterPlayerKits } from '@/lib/player-utils';
import { trackPageView } from '@/lib/analytics';
import { BackToTop } from '@/components/back-to-top';
import { PlayerCard } from '@/components/PlayerCard';
import { KitDialog } from '@/components/KitDialog';
import { BiographyDialog } from '@/components/BiographyDialog';
import { TimelineContent } from '@/components/TimelineContent';
import { RippleButton } from '@/components/ui/ripple-button';
import { HEADER_CONFIG } from '@/config/kit-viewer.config';
import { PlayerCardSkeletonGrid } from '@/components/ui/skeleton-shimmer';

const AUTH_TOKEN_KEY = 'admin-auth-token';

// Recupera il token salvato
function getStoredToken(): string | null {
  try {
    // Prova sessionStorage
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return token;
  } catch {
    // sessionStorage non disponibile
  }
  
  try {
    // Prova cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === AUTH_TOKEN_KEY && value) {
        return decodeURIComponent(value);
      }
    }
  } catch {
    // cookie non disponibile
  }
  
  return null;
}

// Salva il token
function saveToken(token: string): void {
  try {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignora errori
  }
  try {
    document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
  } catch {
    // Ignora errori
  }
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  
  // Ref per evitare stale closures nell'interval
  const headerBackgroundsRef = useRef<string[]>([]);
  
  // Data states
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [playerNationFilter, setPlayerNationFilter] = useState('all');
  // Nazione di default del filtro (Italia, se presente tra i giocatori), altrimenti 'all'
  const [defaultNationId, setDefaultNationId] = useState('all');
  const [kitSeasonFilter, setKitSeasonFilter] = useState('');
  // Nome della nazione del campionato del kit ('' = tutte)
  const [leagueNationFilter, setLeagueNationFilter] = useState('');
  // Nome del campionato del kit ('' = tutti)
  const [leagueNameFilter, setLeagueNameFilter] = useState('');
  const [kitTeamFilter, setKitTeamFilter] = useState('');
  
  // UI states
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState<string>('');
  const [headerBackgrounds, setHeaderBackgrounds] = useState<string[]>([]);
  const [layer1ImageIndex, setLayer1ImageIndex] = useState(0);
  const [layer2ImageIndex, setLayer2ImageIndex] = useState(1);
  const [layer1IsTop, setLayer1IsTop] = useState(true); // true = layer1 è sopra, false = layer2 è sopra
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  
  // Dialog states
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [selectedKitPlayer, setSelectedKitPlayer] = useState<Player | null>(null);
  const [currentKitIndex, setCurrentKitIndex] = useState<number>(0);
  const [playerKitsList, setPlayerKitsList] = useState<PlayerKit[]>([]);
  const [activeTab, setActiveTab] = useState('home');

  // Solo le nazionalità con almeno un giocatore
  const availableNations = useMemo(() => {
    const usedIds = new Set(players.map(p => p.nationId).filter(Boolean));
    return nations.filter(n => usedIds.has(n.id));
  }, [nations, players]);

  // Tutti i campionati usati da almeno un kit
  const availableLeagueNames = useMemo(() => {
    const names = new Set<string>();
    players.forEach(p => p.PlayerKit.forEach(pk => {
      if (pk.Kit?.League) names.add(pk.Kit.League.name);
    }));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [players]);

  // Nazioni dei campionati usati da almeno un kit (se è scelto un campionato, solo le sue), con bandiera se la nazione esiste
  const availableLeagueNations = useMemo(() => {
    const names = new Set<string>();
    players.forEach(p => p.PlayerKit.forEach(pk => {
      const league = pk.Kit?.League;
      if (league?.nation && (!leagueNameFilter || league.name === leagueNameFilter)) names.add(league.nation);
    }));
    return Array.from(names)
      .sort((a, b) => a.localeCompare(b))
      .map(name => ({ name, nation: nations.find(n => n.name === name) }));
  }, [nations, players, leagueNameFilter]);

  // Cambio campionato: la nazione campionato si azzera solo se non è tra quelle del nuovo campionato
  const handleLeagueNameChange = (value: string) => {
    setLeagueNameFilter(value);
    if (value && leagueNationFilter) {
      const stillValid = players.some(p => p.PlayerKit.some(pk =>
        pk.Kit?.League?.name === value && pk.Kit.League.nation === leagueNationFilter));
      if (!stillValid) setLeagueNationFilter('');
    }
  };

  // Set CSS custom properties for header and tab bar heights
  useEffect(() => {
    const updateVars = () => {
      const headerOnlyH = headerRef.current?.offsetHeight || 0;
      const tabBarH = tabBarRef.current?.offsetHeight || 0;
      const footerH = footerRef.current?.offsetHeight || 45;
      document.documentElement.style.setProperty('--header-only-h', `${headerOnlyH}px`);
      document.documentElement.style.setProperty('--tab-bar-h', `${tabBarH}px`);
      document.documentElement.style.setProperty('--header-h', `${headerOnlyH + tabBarH}px`);
      document.documentElement.style.setProperty('--footer-h', `${footerH}px`);
    };
    updateVars();
    window.addEventListener('resize', updateVars);

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateVars) : null;
    if (ro && headerRef.current) ro.observe(headerRef.current);
    if (ro && tabBarRef.current) ro.observe(tabBarRef.current);
    if (ro && footerRef.current) ro.observe(footerRef.current);

    return () => {
      window.removeEventListener('resize', updateVars);
      ro?.disconnect();
    };
  }, [loading, activeTab]);

  useEffect(() => {
    fetchData();
    loadRandomBackground();
    trackHomePageView();
  }, []);

  // Carica le immagini di sfondo disponibili per l'header
  useEffect(() => {
    const loadHeaderBackgrounds = async () => {
      try {
        const res = await fetch('/api/backgrounds/header');
        const data = await res.json();
        
        if (data.hasImages && data.images && data.images.length > 0) {
          const images = data.images;
          setHeaderBackgrounds(images);
          headerBackgroundsRef.current = images;
          
          // Imposta indici casuali per iniziare
          const randomIndex1 = Math.floor(Math.random() * images.length);
          const randomIndex2 = (randomIndex1 + 1) % images.length;
          setLayer1ImageIndex(randomIndex1);
          setLayer2ImageIndex(randomIndex2);
          
          // Precarica tutte le immagini e poi segnala che sono pronte
          let loadedCount = 0;
          images.forEach((img: string) => {
            const preloadImg = new window.Image();
            preloadImg.onload = () => {
              loadedCount++;
              if (loadedCount === images.length) {
                setImagesLoaded(true);
              }
            };
            preloadImg.onerror = () => {
              loadedCount++;
              if (loadedCount === images.length) {
                setImagesLoaded(true);
              }
            };
            preloadImg.src = `/background/header/${img}`;
          });
          
          // Fallback: segnala come caricato dopo 2 secondi comunque
          setTimeout(() => setImagesLoaded(true), 2000);
        } else {
          setHeaderBackgrounds([]);
          headerBackgroundsRef.current = [];
          setImagesLoaded(true);
        }
      } catch (error) {
        console.error('Error loading header backgrounds:', error);
        setHeaderBackgrounds([]);
        headerBackgroundsRef.current = [];
        setImagesLoaded(true);
      }
    };
    
    loadHeaderBackgrounds();
  }, []);

  // Cambia lo sfondo dell'header - fade-out del layer superiore
  useEffect(() => {
    if (headerBackgrounds.length <= 1 || !imagesLoaded) return;

    const fadeOutDuration = 1000; // 1 secondo per il fade
    
    const interval = setInterval(() => {
      // Inizia il fade-out del layer superiore
      setIsTransitioning(true);
      
      // Dopo il fade-out completo:
      // 1. Scambia quale layer è sopra (z-index)
      // 2. Prepara la prossima immagine nel layer che ora è SOTTO
      setTimeout(() => {
        const totalImages = headerBackgroundsRef.current.length;
        
        // Scambia quale layer è sopra
        const newLayer1IsTop = !layer1IsTop;
        setLayer1IsTop(newLayer1IsTop);
        
        // Il layer che ORA è sotto deve avere la prossima immagine
        // Se layer1 ora è sotto (newLayer1IsTop = false), aggiorna layer1ImageIndex
        // Se layer2 ora è sotto (newLayer1IsTop = true), aggiorna layer2ImageIndex
        const topLayerImageIndex = newLayer1IsTop ? layer1ImageIndex : layer2ImageIndex;
        const nextImageIndex = (topLayerImageIndex + 1) % totalImages;
        
        if (newLayer1IsTop) {
          // Layer1 è sopra, layer2 è sotto -> aggiorna layer2
          setLayer2ImageIndex(nextImageIndex);
        } else {
          // Layer2 è sopra, layer1 è sotto -> aggiorna layer1
          setLayer1ImageIndex(nextImageIndex);
        }
        
        // Fine transizione
        setIsTransitioning(false);
      }, fadeOutDuration);
    }, HEADER_CONFIG.background.changeInterval);
    
    return () => clearInterval(interval);
  }, [headerBackgrounds, imagesLoaded, layer1IsTop, layer1ImageIndex, layer2ImageIndex]);

  // Controlla se c'è un token nell'URL (quando si torna dall'admin)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('t');
      if (urlToken) {
        saveToken(urlToken);
        // Rimuovi il token dall'URL
        window.history.replaceState({}, '', '/');
      }
    }
  }, []);

  // Controlla se c'è un parametro kit nell'URL (per condivisione)
  useEffect(() => {
    if (typeof window !== 'undefined' && players.length > 0) {
      const params = new URLSearchParams(window.location.search);
      const kitId = params.get('kit');
      if (kitId) {
        // Trova il kit e il giocatore associato
        const playerKit = players.find(p => p.PlayerKit.some(pk => pk.Kit.id === kitId));
        if (playerKit) {
          const pk = playerKit.PlayerKit.find(pk => pk.Kit.id === kitId);
          if (pk) {
            handleKitClick(pk.Kit, playerKit);
            // Rimuovi il parametro dall'URL
            window.history.replaceState({}, '', window.location.pathname);
          }
        }
      }
    }
  }, [players]);

  // Track home page view
  const trackHomePageView = async () => {
    await trackPageView('home');
  };

  // Load random background image
  const loadRandomBackground = async () => {
    try {
      const res = await fetch('/api/backgrounds');
      const data = await res.json();
      if (data.images && data.images.length > 0) {
        const randomIndex = Math.floor(Math.random() * data.images.length);
        setBackgroundImage(`/background/${data.images[randomIndex]}`);
      }
    } catch (error) {
      console.error('Error loading background:', error);
    }
  };

  // Filter players
  useEffect(() => {
    const filtered = players.filter(player => {
      const matchesSearch = !searchQuery ||
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.surname && player.surname.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesNation = playerNationFilter === 'all' || player.nationId === playerNationFilter;
      
      // Se ci sono filtri kit attivi, verifica che il giocatore abbia almeno un kit che rispetta i filtri
      const hasMatchingKit = !kitSeasonFilter && !kitTeamFilter && !leagueNationFilter && !leagueNameFilter ||
        filterPlayerKits(player, kitSeasonFilter, kitTeamFilter, leagueNationFilter, leagueNameFilter).length > 0;
      
      return matchesSearch && matchesNation && hasMatchingKit;
    });
    
    // Sort by status: NUOVO and AGGIORNATO first
    const sorted = filtered.sort((a, b) => {
      const statusOrder: Record<string, number> = {
        'NUOVO': 0,
        'AGGIORNATO': 1,
        'NON_IMPOSTATO': 2,
      };
      const orderA = statusOrder[a.status || 'NON_IMPOSTATO'] ?? 2;
      const orderB = statusOrder[b.status || 'NON_IMPOSTATO'] ?? 2;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      // Then sort by name
      return `${a.name} ${a.surname || ''}`.localeCompare(`${b.name} ${b.surname || ''}`);
    });
    
    setFilteredPlayers(sorted);
  }, [searchQuery, playerNationFilter, kitSeasonFilter, kitTeamFilter, leagueNationFilter, leagueNameFilter, players]);

  const fetchData = async () => {
    try {
      const [playersRes, nationsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/nations'),
      ]);
      const [playersData, nationsData] = await Promise.all([
        playersRes.json(),
        nationsRes.json(),
      ]);
      // Ensure we have arrays, not error objects
      if (Array.isArray(playersData)) {
        setPlayers(playersData);
        setFilteredPlayers(playersData);
      } else {
        console.error('Players data is not an array:', playersData);
        setPlayers([]);
        setFilteredPlayers([]);
      }
      if (Array.isArray(nationsData)) {
        setNations(nationsData);
        // Default filtro: Italia (solo se ha almeno un giocatore, altrimenti la lista sarebbe vuota)
        if (Array.isArray(playersData)) {
          const italy = nationsData.find((n: Nation) =>
            ['ITA', 'IT'].includes(String(n.code).toUpperCase()) ||
            ['italia', 'italy'].includes(String(n.name).toLowerCase())
          );
          if (italy && playersData.some((p: Player) => p.nationId === italy.id)) {
            setDefaultNationId(italy.id);
            setPlayerNationFilter(italy.id);
          }
        }
      } else {
        console.error('Nations data is not an array:', nationsData);
        setNations([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminClick = () => {
    const token = getStoredToken();
    
    if (token) {
      window.location.href = `/admin/dashboard?t=${encodeURIComponent(token)}`;
    } else {
      window.location.href = '/admin/login';
    }
  };

  // Scorciatoia per accedere all'area admin: Ctrl + Shift + L (funziona in Home e Timeline)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && !e.altKey && !e.metaKey && e.code === 'KeyL') {
        e.preventDefault();
        handleAdminClick();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Gesto per accedere all'area admin da mobile: 5 tocchi rapidi sul logo
  const logoTapsRef = useRef({ count: 0, last: 0 });
  const handleLogoTap = () => {
    const now = Date.now();
    const t = logoTapsRef.current;
    t.count = now - t.last < 600 ? t.count + 1 : 1;
    t.last = now;
    if (t.count >= 5) {
      t.count = 0;
      handleAdminClick();
    }
  };

  const handleKitClick = (kit: Kit, player: Player) => {
    const kits = sortKitsBySeason(filterPlayerKits(player, kitSeasonFilter, kitTeamFilter, leagueNationFilter, leagueNameFilter));
    const index = kits.findIndex(pk => pk.Kit?.id === kit.id);
    setSelectedKit(kit);
    setSelectedKitPlayer(player);
    setPlayerKitsList(kits);
    setCurrentKitIndex(index >= 0 ? index : 0);
    trackPageView('kit-detail');
  };

  const handleKitDialogClose = () => {
    setSelectedKit(null);
    setSelectedKitPlayer(null);
    setPlayerKitsList([]);
  };

  const navigateToPreviousKit = () => {
    if (currentKitIndex > 0) {
      const newIndex = currentKitIndex - 1;
      setCurrentKitIndex(newIndex);
      if (playerKitsList[newIndex]?.Kit) {
        setSelectedKit(playerKitsList[newIndex].Kit);
      }
    }
  };

  const navigateToNextKit = () => {
    if (currentKitIndex < playerKitsList.length - 1) {
      const newIndex = currentKitIndex + 1;
      setCurrentKitIndex(newIndex);
      if (playerKitsList[newIndex]?.Kit) {
        setSelectedKit(playerKitsList[newIndex].Kit);
      }
    }
  };

  // Pannello filtri desktop (collassabile). La ricerca resta sempre visibile e non conta nel badge.
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilterCount =
    (playerNationFilter !== defaultNationId ? 1 : 0) + (leagueNationFilter ? 1 : 0) + (leagueNameFilter ? 1 : 0) + (kitSeasonFilter ? 1 : 0) + (kitTeamFilter ? 1 : 0);

  // Chip dei filtri attivi (la ricerca è già visibile; l'Italia di default non conta)
  const activeChips = [
    playerNationFilter !== defaultNationId && {
      key: 'nation',
      label: `Giocatore: ${playerNationFilter === 'all' ? 'Tutte' : nations.find(n => n.id === playerNationFilter)?.name ?? ''}`,
      clear: () => setPlayerNationFilter(defaultNationId),
    },
    leagueNameFilter && { key: 'league', label: leagueNameFilter, clear: () => setLeagueNameFilter('') },
    leagueNationFilter && { key: 'leagueNation', label: `Campionato: ${leagueNationFilter}`, clear: () => setLeagueNationFilter('') },
    kitSeasonFilter && { key: 'season', label: `Stagione: ${kitSeasonFilter}`, clear: () => setKitSeasonFilter('') },
    kitTeamFilter && { key: 'team', label: kitTeamFilter, clear: () => setKitTeamFilter('') },
  ].filter(Boolean) as { key: string; label: string; clear: () => void }[];

  const resetFilters = () => {
    setSearchQuery('');
    setPlayerNationFilter(defaultNationId);
    setKitSeasonFilter('');
    setKitTeamFilter('');
    setLeagueNationFilter('');
    setLeagueNameFilter('');
  };

  const hasActiveFilters = playerNationFilter !== defaultNationId || leagueNationFilter || leagueNameFilter || kitSeasonFilter || kitTeamFilter || searchQuery;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header 
        ref={headerRef} 
        className="border-b shadow-sm sticky top-0 z-40 overflow-hidden"
      >
        {/* Background layers - fade-out del layer superiore */}
        {/* Layer base (sfondo nero di fallback) */}
        <div 
          className="absolute inset-0"
          style={{ backgroundColor: '#000000', zIndex: 0 }}
        />
        
        {/* Layer 1 */}
        {headerBackgrounds.length > 0 && headerBackgrounds[layer1ImageIndex] && (
          <img
            src={`/background/header/${headerBackgrounds[layer1ImageIndex]}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              opacity: imagesLoaded ? (layer1IsTop ? (isTransitioning ? 0 : 1) : 1) : 0,
              zIndex: layer1IsTop ? 2 : 1,
              transition: layer1IsTop ? 'opacity 1000ms ease-in-out' : 'none',
            }}
          />
        )}
        
        {/* Layer 2 */}
        {headerBackgrounds.length > 0 && headerBackgrounds[layer2ImageIndex] && (
          <img
            src={`/background/header/${headerBackgrounds[layer2ImageIndex]}`}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ 
              opacity: imagesLoaded ? (layer1IsTop ? 1 : (isTransitioning ? 0 : 1)) : 0,
              zIndex: layer1IsTop ? 1 : 2,
              transition: !layer1IsTop ? 'opacity 1000ms ease-in-out' : 'none',
            }}
          />
        )}
        
        {/* Overlay layer for readability - opacità dalla configurazione */}
        <div 
          className="absolute inset-0 z-[3]"
          style={headerBackgrounds.length > 0 ? {
            backgroundColor: `rgba(0, 0, 0, ${HEADER_CONFIG.background.overlayOpacity})`,
          } : {
            backgroundColor: 'rgba(0, 0, 0, 0.95)',
          }}
        />
        {/* Content */}
        <div className="relative z-[4]">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div
                className="overflow-hidden flex-shrink-0 flex items-center justify-center select-none"
                style={{ touchAction: 'manipulation' }}
                onClick={handleLogoTap}
              >
                <img
                  src="logo/logo.png"
                  alt="GK retro Kits"
                  className="h-28 sm:h-32 md:h-36 lg:h-40 w-auto object-contain"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoLoaded(false)}
                />
              </div>
            </div>

            {/* Burger Menu Mobile */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden flex-shrink-0 backdrop-blur-md bg-black/50 border-white/20 hover:bg-black/70"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </div>

        </div>
        </div>
      </header>

      {/* Tab Bar - sticky below header */}
      <div
        ref={tabBarRef}
        className="sticky z-30 bg-black/70 backdrop-blur-md border-b border-white/10"
        style={{ top: 'var(--header-only-h, 0px)' }}
      >
        <div className="flex items-center justify-center gap-4 py-1.5 px-4">
          {/* Left filters - Desktop */}
          <div className="hidden lg:flex items-center gap-3 flex-1 justify-end">
            {/* Search player */}
            <div className="relative w-full max-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
              <Input
                type="text"
                placeholder="Cerca giocatore..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-10 backdrop-blur-md bg-black/70 focus-visible:border-white focus-visible:ring-0 ${searchQuery ? '!border-white' : 'border-white/20'}`}
                suppressHydrationWarning
              />
            </div>
          </div>

          {/* Tab buttons */}
          <div className="bg-black/60 border border-white/20 h-10 rounded-lg p-0.5 gap-1 inline-flex items-center flex-shrink-0">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-6 py-1.5 text-sm font-bold transition-all rounded-lg inline-flex items-center ${
                activeTab === 'home'
                  ? 'bg-[#cd2127] text-white shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <UserIcon className="w-4 h-4 mr-1.5" />
              Home
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-6 py-1.5 text-sm font-bold transition-all rounded-lg inline-flex items-center ${
                activeTab === 'timeline'
                  ? 'bg-[#cd2127] text-white shadow-lg'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4 mr-1.5" />
              Timeline
            </button>
          </div>

          {/* Right - Desktop: tasto filtri con badge */}
          <div className="hidden lg:flex items-center gap-2 flex-1 min-w-0">
            <Button
              variant="outline"
              onClick={() => setFiltersOpen((o) => !o)}
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              className={`relative whitespace-nowrap backdrop-blur-md bg-black/70 hover:bg-black/80 ${activeFilterCount > 0 || filtersOpen ? '!border-white' : 'border-white/20'}`}
            >
              <SlidersHorizontal className="w-4 h-4 mr-2" />
              Filtri
              {activeFilterCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full bg-[#cd2127] text-white text-xs font-bold flex items-center justify-center shadow">
                  {activeFilterCount}
                </span>
              )}
            </Button>

            {/* Chip dei filtri attivi: una riga, scorrevole in orizzontale */}
            {activeChips.length > 0 && (
              <div
                className="flex items-center gap-1.5 min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                onWheel={(e) => { if (e.deltaY) e.currentTarget.scrollLeft += e.deltaY; }}
              >
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.clear}
                    title="Rimuovi filtro"
                    className="flex-shrink-0 inline-flex items-center gap-1 h-7 pl-2.5 pr-1.5 rounded-full border border-white/30 bg-black/60 text-xs text-white hover:bg-black/80 whitespace-nowrap"
                  >
                    {chip.label}
                    <X className="w-3.5 h-3.5 text-white/70" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Pannello filtri collassabile - Desktop */}
        <div
          id="filters-panel"
          inert={!filtersOpen}
          className={`hidden lg:grid transition-[grid-template-rows] duration-300 ease-in-out ${filtersOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
          <div className="overflow-hidden">
            <div className="flex items-end justify-center gap-3 px-4 pt-1 pb-3">
              {/* Nationality filter */}
              <div className="w-full max-w-[240px] space-y-1">
                <label className="text-xs text-white/70">Nazionalità giocatore</label>
                <Select value={playerNationFilter} onValueChange={setPlayerNationFilter}>
                  <SelectTrigger className={`w-full backdrop-blur-md bg-black/70 focus-visible:border-white focus-visible:ring-0 ${playerNationFilter !== defaultNationId ? '!border-white' : 'border-white/20'}`}>
                    <span className={playerNationFilter === 'all' ? 'text-white/70' : 'text-white'}>
                      {playerNationFilter === 'all' ? 'Tutte le nazionalità' : nations.find(n => n.id === playerNationFilter)?.name}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le nazionalità</SelectItem>
                    {availableNations.map((nation) => (
                      <SelectItem key={nation.id} value={nation.id} className="gap-2">
                        <span className="flex items-center gap-2">
                          <Flag code={convertAlpha3ToAlpha2(nation.code)} className="w-4 h-3 object-cover" />
                          {nation.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* League filter */}
              <div className="w-full max-w-[240px] space-y-1">
                <label className="text-xs text-white/70">Campionato</label>
                <Select value={leagueNameFilter || 'all'} onValueChange={(v) => handleLeagueNameChange(v === 'all' ? '' : v)}>
                  <SelectTrigger className={`w-full backdrop-blur-md bg-black/70 focus-visible:border-white focus-visible:ring-0 ${leagueNameFilter ? '!border-white' : 'border-white/20'}`}>
                    <span className={leagueNameFilter ? 'text-white' : 'text-white/70'}>
                      {leagueNameFilter || 'Tutti i campionati'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i campionati</SelectItem>
                    {availableLeagueNames.map((name) => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* League nation filter */}
              <div className="w-full max-w-[240px] space-y-1">
                <label className="text-xs text-white/70">Nazionalità campionato</label>
                <Select value={leagueNationFilter || 'all'} onValueChange={(v) => setLeagueNationFilter(v === 'all' ? '' : v)}>
                  <SelectTrigger className={`w-full backdrop-blur-md bg-black/70 focus-visible:border-white focus-visible:ring-0 ${leagueNationFilter ? '!border-white' : 'border-white/20'}`}>
                    <span className={leagueNationFilter ? 'text-white' : 'text-white/70'}>
                      {leagueNationFilter || 'Tutte le nazionalità'}
                    </span>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le nazionalità</SelectItem>
                    {availableLeagueNations.map(({ name, nation }) => (
                      <SelectItem key={name} value={name} className="gap-2">
                        <span className="flex items-center gap-2">
                          {nation && <Flag code={convertAlpha3ToAlpha2(nation.code)} className="w-4 h-3 object-cover" />}
                          {name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Season filter */}
              <div className="w-full max-w-[240px] space-y-1">
                <label className="text-xs text-white/70">Stagione</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    type="text"
                    placeholder="Filtra per stagione..."
                    value={kitSeasonFilter}
                    onChange={(e) => setKitSeasonFilter(e.target.value)}
                    className={`pl-10 backdrop-blur-md bg-black/70 focus-visible:border-white focus-visible:ring-0 ${kitSeasonFilter ? '!border-white' : 'border-white/20'}`}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {/* Team filter */}
              <div className="w-full max-w-[240px] space-y-1">
                <label className="text-xs text-white/70">Squadra/Nazionale</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground z-10" />
                  <Input
                    type="text"
                    placeholder="Filtra per squadra/nazionale..."
                    value={kitTeamFilter}
                    onChange={(e) => setKitTeamFilter(e.target.value)}
                    className={`pl-10 backdrop-blur-md bg-black/70 focus-visible:border-white focus-visible:ring-0 ${kitTeamFilter ? '!border-white' : 'border-white/20'}`}
                    suppressHydrationWarning
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" onClick={resetFilters} className="whitespace-nowrap backdrop-blur-md bg-black/70 border-white/20 hover:bg-black/80 flex-shrink-0">
                  Resetta filtri
                </Button>
              )}
              <Button onClick={() => setFiltersOpen(false)} className="whitespace-nowrap bg-[#cd2127] hover:bg-[#cd2127]/90 text-white flex-shrink-0">
                <X className="w-4 h-4 mr-1.5" />
                Chiudi
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4 px-2">
            {/* Filters */}
            <div className="space-y-4 p-2">
              <h3 className="font-semibold text-sm text-muted-foreground">Filtri</h3>

              {/* Search player */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca giocatore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                  suppressHydrationWarning
                />
              </div>

              {/* Nationality filter */}
              <label className="text-xs text-muted-foreground">Nazionalità giocatore</label>
              <Select value={playerNationFilter} onValueChange={setPlayerNationFilter}>
                <SelectTrigger className="w-full">
                  <span className={playerNationFilter === 'all' ? 'text-muted-foreground' : ''}>
                    {playerNationFilter === 'all' ? 'Tutte le nazionalità' : nations.find(n => n.id === playerNationFilter)?.name}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le nazionalità</SelectItem>
                  {availableNations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id} className="gap-2">
                      <span className="flex items-center gap-2">
                        <Flag code={convertAlpha3ToAlpha2(nation.code)} className="w-4 h-3 object-cover" />
                        {nation.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* League filter */}
              <label className="text-xs text-muted-foreground">Campionato</label>
              <Select value={leagueNameFilter || 'all'} onValueChange={(v) => handleLeagueNameChange(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full">
                  <span className={leagueNameFilter ? '' : 'text-muted-foreground'}>
                    {leagueNameFilter || 'Tutti i campionati'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutti i campionati</SelectItem>
                  {availableLeagueNames.map((name) => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* League nation filter */}
              <label className="text-xs text-muted-foreground">Nazionalità campionato</label>
              <Select value={leagueNationFilter || 'all'} onValueChange={(v) => setLeagueNationFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-full">
                  <span className={leagueNationFilter ? '' : 'text-muted-foreground'}>
                    {leagueNationFilter || 'Tutte le nazionalità'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le nazionalità</SelectItem>
                  {availableLeagueNations.map(({ name, nation }) => (
                    <SelectItem key={name} value={name} className="gap-2">
                      <span className="flex items-center gap-2">
                        {nation && <Flag code={convertAlpha3ToAlpha2(nation.code)} className="w-4 h-3 object-cover" />}
                        {name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Season filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtra per stagione..."
                  value={kitSeasonFilter}
                  onChange={(e) => setKitSeasonFilter(e.target.value)}
                  className="pl-10"
                  suppressHydrationWarning
                />
              </div>

              {/* Team filter */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtra per squadra/nazionale..."
                  value={kitTeamFilter}
                  onChange={(e) => setKitTeamFilter(e.target.value)}
                  className="pl-10"
                  suppressHydrationWarning
                />
              </div>

              {/* Reset button */}
              {hasActiveFilters && (
                <RippleButton variant="outline" size="default" onClick={resetFilters} className="w-full whitespace-nowrap">
                  Resetta filtri
                </RippleButton>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content with Tabs */}
      <div 
        className="bg-fixed flex-1"
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
      >
        <div ref={containerRef} className={`content ${activeTab === 'timeline' ? 'content-timeline' : ''}`}>
          {/* Home Tab - uses main wrapper with padding */}
          {activeTab === 'home' && (
            <main className="flex-1 container mx-auto px-4 py-6">
              {loading ? (
                <PlayerCardSkeletonGrid count={8} />
              ) : filteredPlayers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-96 text-center">
                  <UserIcon className="w-16 h-16 text-muted-foreground/30 mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {searchQuery ? 'Nessun risultato trovato' : 'Nessun giocatore presente'}
                  </h3>
                  <p className="text-muted-foreground">
                    {searchQuery ? 'Prova con una ricerca diversa' : 'Nessun contenuto disponibile'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {filteredPlayers.map((player, index) => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      kitSeasonFilter={kitSeasonFilter}
                      leagueNationFilter={leagueNationFilter}
                      leagueNameFilter={leagueNameFilter}
                      kitTeamFilter={kitTeamFilter}
                      onPlayerClick={setSelectedPlayer}
                      onKitClick={handleKitClick}
                      index={index}
                    />
                  ))}
                </div>
              )}
            </main>
          )}

          {/* Timeline Tab - fills full space, manages own scrolling */}
          {activeTab === 'timeline' && (
            <TimelineContent 
              onKitClick={handleKitClick}
            />
          )}
        </div>
      </div>

      {/* Back to Top Button */}
      <BackToTop
        scrollContainerRef={containerRef}
        threshold={200}
        variant="secondary"
        bottomOffset="3rem"
        sideOffset="2rem"
        position="right"
      />

      {/* Overlay blur for dialogs */}
      {(selectedKit || selectedPlayer) && (
        <div className="fixed inset-0 bg-background/30 backdrop-blur-md z-50 pointer-events-none" />
      )}

      {/* Kit Detail Dialog */}
      <KitDialog
        selectedKit={selectedKit}
        selectedKitPlayer={selectedKitPlayer}
        playerKitsList={playerKitsList}
        currentKitIndex={currentKitIndex}
        onClose={handleKitDialogClose}
        onNavigatePrevious={navigateToPreviousKit}
        onNavigateNext={navigateToNextKit}
      />

      {/* Player Biography Dialog */}
      <BiographyDialog
        selectedPlayer={selectedPlayer}
        onClose={() => setSelectedPlayer(null)}
        onOpen={() => trackPageView('player-biography')}
      />

      {/* Footer */}
      <footer ref={footerRef} className="fixed bottom-0 left-0 right-0 backdrop-blur-md bg-black/70 border-t border-white/10 py-3 px-4 footer z-20">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 GK Retro Kits. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
