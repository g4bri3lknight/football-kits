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
import { BackToTop } from '@/components/back-to-top';
import { PlayerCard } from '@/components/PlayerCard';
import { KitDialog } from '@/components/KitDialog';
import { BiographyDialog } from '@/components/BiographyDialog';

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  
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
  }, []);

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
      return matchesSearch && matchesNation;
    });
    setFilteredPlayers(filtered);
  }, [searchQuery, playerNationFilter, players]);

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
      setPlayers(playersData);
      setFilteredPlayers(playersData);
      setNations(nationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminClick = () => {
    window.location.href = '/admin/login';
  };

  const handleKitClick = (kit: Kit, player: Player) => {
    const kits = sortKitsBySeason(filterPlayerKits(player, kitSeasonFilter, kitTeamFilter));
    const index = kits.findIndex(pk => pk.Kit.id === kit.id);
    setSelectedKit(kit);
    setSelectedKitPlayer(player);
    setPlayerKitsList(kits);
    setCurrentKitIndex(index >= 0 ? index : 0);
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
      <header ref={headerRef} className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="overflow-hidden flex-shrink-0 flex items-center justify-center">
                <img
                  src="upload/GK-retro-Kits.png"
                  alt="GK retro Kits"
                  className="h-20 sm:h-24 md:h-28 lg:h-32 w-auto object-contain"
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
              className="lg:hidden flex-shrink-0"
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
                className="flex-shrink-0"
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Filters - Desktop */}
          <div className="hidden lg:block mt-6">
            <div className="flex flex-wrap items-start gap-3">
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
                <Button variant="outline" size="default" onClick={resetFilters} className="whitespace-nowrap">
                  Resetta filtri
                </Button>
              )}
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
