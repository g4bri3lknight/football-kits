'use client';

import { useEffect, useState, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Search, User as UserIcon, Settings, Menu } from 'lucide-react';
import Flag from 'react-world-flags';

import { Nation, Player, Kit, PlayerKit } from '@/types';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';
import { sortKitsBySeason, filterPlayerKits } from '@/lib/player-utils';
import { trackPageView } from '@/lib/analytics';
import { BackToTop } from '@/components/back-to-top';
import { PlayerCard } from '@/components/PlayerCard';
import { KitDialog } from '@/components/KitDialog';
import { BiographyDialog } from '@/components/BiographyDialog';
import { HEADER_CONFIG } from '@/config/kit-viewer.config';

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
  const [kitSeasonFilter, setKitSeasonFilter] = useState('');
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

  // Dynamic header height calculation
  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        const height = headerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--header-h', `${height}px`);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    return () => window.removeEventListener('resize', updateHeaderHeight);
  }, [loading, players, nations]);

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
      const hasMatchingKit = !kitSeasonFilter && !kitTeamFilter || 
        player.PlayerKit.some(pk => {
          const matchesSeason = !kitSeasonFilter || 
            pk.Kit.name.toLowerCase().includes(kitSeasonFilter.toLowerCase());
          const matchesTeam = !kitTeamFilter || 
            pk.Kit.team.toLowerCase().includes(kitTeamFilter.toLowerCase());
          return matchesSeason && matchesTeam;
        });
      
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
  }, [searchQuery, playerNationFilter, kitSeasonFilter, kitTeamFilter, players]);

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

  const handleKitClick = (kit: Kit, player: Player) => {
    const kits = sortKitsBySeason(filterPlayerKits(player, kitSeasonFilter, kitTeamFilter));
    const index = kits.findIndex(pk => pk.Kit.id === kit.id);
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
      setSelectedKit(playerKitsList[newIndex].Kit);
    }
  };

  const navigateToNextKit = () => {
    if (currentKitIndex < playerKitsList.length - 1) {
      const newIndex = currentKitIndex + 1;
      setCurrentKitIndex(newIndex);
      setSelectedKit(playerKitsList[newIndex].Kit);
    }
  };

  const resetFilters = () => {
    setSearchQuery('');
    setPlayerNationFilter('all');
    setKitSeasonFilter('');
    setKitTeamFilter('');
  };

  const hasActiveFilters = playerNationFilter !== 'all' || kitSeasonFilter || kitTeamFilter || searchQuery;

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
              <div className="overflow-hidden flex-shrink-0 flex items-center justify-center">
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
              className="lg:hidden flex-shrink-0 backdrop-blur-md bg-black/30 border-white/20 hover:bg-black/50"
            >
              <Menu className="w-5 h-5" />
            </Button>

            {/* Desktop: Admin Button */}
            <div className="hidden lg:flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handleAdminClick}
                title="Pannello Admin"
                className="flex-shrink-0 backdrop-blur-md bg-black/30 border-white/20 hover:bg-black/50"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Filters - Desktop */}
          <div className="hidden lg:block mt-6">
            <div className="flex flex-wrap items-start gap-3 backdrop-blur-md bg-black/20 rounded-lg p-3 -mx-3">
              {/* Search player */}
              <div className="relative flex-1 min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
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
              <div className="flex-1 min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
                <Select value={playerNationFilter} onValueChange={setPlayerNationFilter}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Filtra per nazionalità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le nazionalità</SelectItem>
                    {nations.map((nation) => (
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

              {/* Season filter */}
              <div className="relative flex-1 min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
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
              <div className="relative flex-1 min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
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
                <Button variant="outline" size="default" onClick={resetFilters} className="whitespace-nowrap backdrop-blur-md bg-black/30 border-white/20 hover:bg-black/50">
                  Resetta filtri
                </Button>
              )}
            </div>
          </div>
        </div>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[350px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex flex-col gap-4 px-2">
            {/* Admin Button */}
            <Button
              variant="outline"
              onClick={() => {
                setMobileMenuOpen(false);
                handleAdminClick();
              }}
              className="w-full justify-start gap-2"
            >
              <Settings className="w-4 h-4" />
              Pannello Admin
            </Button>

            <Separator />

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
              <Select value={playerNationFilter} onValueChange={setPlayerNationFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtra per nazionalità" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tutte le nazionalità</SelectItem>
                  {nations.map((nation) => (
                    <SelectItem key={nation.id} value={nation.id} className="gap-2">
                      <span className="flex items-center gap-2">
                        <Flag code={convertAlpha3ToAlpha2(nation.code)} className="w-4 h-3 object-cover" />
                        {nation.name}
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
                <Button variant="outline" size="default" onClick={resetFilters} className="w-full whitespace-nowrap">
                  Resetta filtri
                </Button>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div 
        className="bg-fixed"
        style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : {}}
      >
        <div ref={containerRef} className="content">
          <main className="flex-1 container mx-auto px-4 py-6">
            {loading ? (
              <div className="flex items-center justify-center h-96">
                <div className="text-center">
                  <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Caricamento in corso...</p>
                </div>
              </div>
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
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    kitSeasonFilter={kitSeasonFilter}
                    kitTeamFilter={kitTeamFilter}
                    onPlayerClick={setSelectedPlayer}
                    onKitClick={handleKitClick}
                  />
                ))}
              </div>
            )}
          </main>
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
      <footer className="bg-background border-t py-3 px-4 mt-auto footer">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 GK Retro Kits. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}
