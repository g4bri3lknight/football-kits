'use client';

import { useEffect, useState, useRef } from 'react';
import { getImageUrl } from '@/lib/image-url';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Shirt, User as UserIcon, Settings, BookOpen, ExternalLink } from 'lucide-react';
import KitViewer3D from '@/components/KitViewer3D';
import Flag from 'react-world-flags';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';
import { BackToTop } from '@/components/back-to-top';


interface Nation {
  id: string;
  name: string;
  code: string;
  flag?: string;
}

interface Player {
  id: string;
  name: string;
  surname?: string;
  nationId?: string | null;
  Nation?: Nation | null;
  image?: string;
  biography?: string;
  PlayerKit: PlayerKit[];
}

interface Kit {
  id: string;
  name: string;
  team: string;
  type: string;
  imageUrl?: string;
  model3DUrl?: string;
  logoUrl?: string;
}

interface PlayerKit {
  id: string;
  playerId: string;
  kitId: string;
  Kit: Kit;
}

export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playerNationFilter, setPlayerNationFilter] = useState('all');
  const [kitSeasonFilter, setKitSeasonFilter] = useState('');
  const [kitTeamFilter, setKitTeamFilter] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);
  const [selectedKitPlayer, setSelectedKitPlayer] = useState<Player | null>(null);
  const [currentKitIndex, setCurrentKitIndex] = useState<number>(0);
  const [playerKitsList, setPlayerKitsList] = useState<PlayerKit[]>([]);
  const [logoLoaded, setLogoLoaded] = useState(false);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  // Filtra i giocatori in base alla ricerca e alla nazionalità
  useEffect(() => {
    const filtered = players.filter(player => {
      // Filtro per nome/cognome
      const matchesSearch = !searchQuery ||
        player.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (player.surname && player.surname.toLowerCase().includes(searchQuery.toLowerCase()));

      // Filtro per nazionalità
      const matchesNation = playerNationFilter === 'all' ||
        player.nationId === playerNationFilter;

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

  const handleKitClick = (kit: Kit, player: Player) => {
    const kits = sortKitsBySeason(filterPlayerKits(player));
    const index = kits.findIndex(pk => pk.Kit.id === kit.id);
    setSelectedKit(kit);
    setSelectedKitPlayer(player);
    setPlayerKitsList(kits);
    setCurrentKitIndex(index >= 0 ? index : 0);
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

  // Funzione per filtrare i kit di un player
  const filterPlayerKits = (player: Player) => {
    return player.PlayerKit.filter(pk => {
      const matchesSeason = !kitSeasonFilter ||
        pk.Kit.name.toLowerCase().includes(kitSeasonFilter.toLowerCase());
      const matchesTeam = !kitTeamFilter ||
        pk.Kit.team.toLowerCase().includes(kitTeamFilter.toLowerCase());
      return matchesSeason && matchesTeam;
    });
  };

  const getKitTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      home: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      away: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      third: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      gk: 'gk-badge',
    };
    return colors[type] || 'gk-badge';
  };

  const handleAdminClick = () => {
    window.location.href = '/admin/login';
  };

  const translateKitType = (type: string): string => {
    const translations: Record<string, string> = {
      home: 'Home',
      away: 'Away',
      third: 'Third',
      gk: 'GK',
      goalkeeper: 'GK',
      Goalkeeper: 'GK',
    };
    return translations[type] || type;
  };

  const getPlayerDisplayName = (player: Player): string => {
    return player.surname ? `${player.name} ${player.surname}` : player.name;
  };

  const isUrl = (text: string) => {
    try {
      new URL(text);
      return true;
    } catch {
      return false;
    }
  };

  // Funzione per convertire gli URL in link cliccabili nel testo
  const renderTextWithLinks = (text: string) => {
    // Regex per trovare URL (http, https, www)
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
    const parts = text.split(urlRegex);

    return parts.map((part, index) => {
      // Verifica se questa parte è un URL
      if (urlRegex.test(part)) {
        const url = part.startsWith('www.') ? `https://${part}` : part;
        return (
          <a
            key={index}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
            onClick={(e) => e.stopPropagation()}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  //Funzione per ordinare i kit per stagione
  const sortKitsBySeason = (kits: PlayerKit[]) => {
    return kits.sort((a, b) => {
      const seasonA = a.Kit.name.match(/\d{4}/);
      const seasonB = b.Kit.name.match(/\d{4}/);
      if (seasonA && seasonB) {
        return parseInt(seasonA[0]) - parseInt(seasonB[0]);
      }
      return 0;
    });
  };


  return (

    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="overflow-hidden flex-shrink-0 flex items-center justify-center ">
                <img
                  src="upload/GK-retro-Kits.png"
                  alt="GK retro Kits"
                  className="h-32 w-auto object-contain"
                  onLoad={() => setLogoLoaded(true)}
                  onError={() => setLogoLoaded(false)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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

          {/* Filtri */}
          <div className="mt-6">
            <div className="flex flex-wrap items-start gap-2 sm:gap-3">
              {/* Ricerca giocatore */}
              <div className="relative flex-1 min-w-[180px] sm:min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
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

              {/* Filtro nazionalità */}
              <div className="flex-1 min-w-[180px] sm:min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
                <Select
                  value={playerNationFilter}
                  onValueChange={setPlayerNationFilter}
                >
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

              {/* Filtro stagione */}
              <div className="relative flex-1 min-w-[180px] sm:min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
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

              {/* Filtro squadra/nazionale */}
              <div className="relative flex-1 min-w-[180px] sm:min-w-[200px] lg:min-w-[220px] xl:min-w-[240px]">
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

              {/* Bottone reset */}
              {(playerNationFilter !== 'all' || kitSeasonFilter || kitTeamFilter || searchQuery) && (
                <Button
                  variant="outline"
                  size="default"
                  onClick={() => {
                    setSearchQuery('');
                    setPlayerNationFilter('all');
                    setKitSeasonFilter('');
                    setKitTeamFilter('');
                  }}
                  className="w-full sm:w-auto whitespace-nowrap"
                >
                  Resetta filtri
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>


      {/* Main Content */}

      <div className="bg-fixed">
        <div ref={containerRef} className="content">

          <main className="flex-1 container mx-auto px-4 py-6 ">
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
                  {searchQuery
                    ? 'Prova con una ricerca diversa'
                    : 'Nessun contenuto disponibile'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredPlayers.map((player) => (
                  <Card
                    key={player.id}
                    className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 transition-custom-color hover:transition-custom-color  backdrop-blur-sm   card-custom-color"
                    onClick={() => setSelectedPlayer(player)}
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-1 avatar-custom-color">
                            <AvatarImage src={getImageUrl(player.image)} alt={player.name} />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {(player.name[0] + (player.surname?.[0] || '')).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-base sm:text-lg truncate">{getPlayerDisplayName(player)}</CardTitle>
                            <div className="flex items-center gap-2 mt-1 flex-wrap">
                              {player.Nation && (
                                <Badge variant="secondary" className="text-xs items-center gap-1.5">
                                  <Flag code={convertAlpha3ToAlpha2(player.Nation.code)} className="w-4 h-3 object-cover" />
                                  {player.Nation.name}
                                </Badge>
                              )}
                              {player.biography && (
                                <Badge variant="outline" className="text-xs">
                                  <BookOpen className="w-3 h-3 mr-1" />
                                  Biografia disponibile
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-3">
                      <ScrollArea className="h-32 sm:h-40 pr-2">
                        <div className="space-y-2">
                          {filterPlayerKits(player).length === 0 ? (
                            <p className="text-sm text-muted-foreground text-center py-4">
                              Nessun kit associato
                            </p>
                          ) : (
                            sortKitsBySeason(filterPlayerKits(player)).map((playerKit) => (
                              <div
                                key={playerKit.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleKitClick(playerKit.Kit, player);
                                }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                              >
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  {playerKit.Kit.logoUrl ? (
                                    <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                                      <img
                                        src={getImageUrl(playerKit.Kit.logoUrl)}
                                        alt={`Logo ${playerKit.Kit.team}`}
                                        className="w-full h-full object-contain p-1"
                                      />
                                    </div>
                                  ) : playerKit.Kit.imageUrl && (
                                    <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                                      <img
                                        src={getImageUrl(playerKit.Kit.imageUrl)}
                                        alt={playerKit.Kit.name}
                                        className="w-full h-full object-cover"
                                      />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {playerKit.Kit.name} - {playerKit.Kit.team}
                                    </p>
                                    <div className="flex items-center gap-1 mt-1">
                                      <Badge className={getKitTypeColor(playerKit.Kit.type)} variant="secondary">
                                        {translateKitType(playerKit.Kit.type)}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
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
        position='right'
      />

      {/* Overlay blur per i dialog */}
      {(selectedKit || selectedPlayer) && (
        <div className="fixed inset-0 bg-background/30 backdrop-blur-md z-50 pointer-events-none" />
      )}

      {/* Kit Detail Dialog */}
      <Dialog open={!!selectedKit} onOpenChange={() => {
        setSelectedKit(null);
        setSelectedKitPlayer(null);
        setPlayerKitsList([]);
      }}>
        <DialogContent className={`w-[95vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] overflow-hidden dialog-custom-color ${playerKitsList.length > 1 ? 'lg:h-[90vh] max-h-[95vh]' : 'lg:h-[85vh] max-h-[90vh]'}`}>
          <DialogHeader>
            <div className="flex items-center justify-between w-full gap-2">
              {/* Kit precedente - solo se piu di un kit */}
              {playerKitsList.length > 1 && currentKitIndex > 0 ? (() => {
                const prevKit = playerKitsList[currentKitIndex - 1].Kit;
                const truncatedName = prevKit.name.length > 8 ? prevKit.name.slice(0, 8) + '...' : prevKit.name;
                return (
                  <button
                    onClick={navigateToPreviousKit}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                    title={prevKit.name}
                  >
                    {prevKit.logoUrl ? (
                      <img
                        src={getImageUrl(prevKit.logoUrl)}
                        alt={prevKit.name}
                        className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                      />
                    ) : prevKit.imageUrl ? (
                      <img
                        src={getImageUrl(prevKit.imageUrl)}
                        alt={prevKit.name}
                        className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-muted rounded flex items-center justify-center">
                        <Shirt className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {truncatedName}
                    </span>
                  </button>
                );
              })() : (
                <div className="w-[80px] sm:w-[100px] flex-shrink-0" />
              )}

              {/* Titolo centrato */}
              <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3 flex-1 justify-center flex-wrap">
                {selectedKit?.logoUrl ? (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden flex-shrink-0">
                    <img
                      src={getImageUrl(selectedKit.logoUrl)}
                      alt={`Logo ${selectedKit.team}`}
                      className="w-full h-full object-contain p-1"
                    />
                  </div>
                ) : selectedKit?.imageUrl && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden flex-shrink-0">
                    <img
                      src={getImageUrl(selectedKit.imageUrl)}
                      alt={selectedKit.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <span className="truncate max-w-[120px] sm:max-w-none">{selectedKit?.name}</span>
                {selectedKit && (
                  <Badge className={getKitTypeColor(selectedKit.type)} variant="secondary">
                    {translateKitType(selectedKit.type)}
                  </Badge>
                )}
              </DialogTitle>

              {/* Kit successivo - solo se piu di un kit */}
              {playerKitsList.length > 1 && currentKitIndex < playerKitsList.length - 1 ? (() => {
                const nextKit = playerKitsList[currentKitIndex + 1].Kit;
                const truncatedName = nextKit.name.length > 8 ? nextKit.name.slice(0, 8) + '...' : nextKit.name;
                return (
                  <button
                    onClick={navigateToNextKit}
                    className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer mr-8"
                    title={nextKit.name}
                  >
                    {nextKit.logoUrl ? (
                      <img
                        src={getImageUrl(nextKit.logoUrl)}
                        alt={nextKit.name}
                        className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                      />
                    ) : nextKit.imageUrl ? (
                      <img
                        src={getImageUrl(nextKit.imageUrl)}
                        alt={nextKit.name}
                        className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded"
                      />
                    ) : (
                      <div className="w-6 h-6 sm:w-7 sm:h-7 bg-muted rounded flex items-center justify-center">
                        <Shirt className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {truncatedName}
                    </span>
                  </button>
                );
              })() : (
                <div className="w-[80px] sm:w-[100px] flex-shrink-0 mr-8" />
              )}
            </div>

            {/* Indicatore di posizione */}
            {playerKitsList.length > 1 && (
              <div className="text-center text-sm text-muted-foreground mt-1">
                {currentKitIndex + 1} / {playerKitsList.length}
              </div>
            )}
          </DialogHeader>

          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="image">Image</TabsTrigger>
              <TabsTrigger value="3d">3D Model</TabsTrigger>
            </TabsList>
            <TabsContent value="image" className="mt-0">
              <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center h-[250px] sm:h-[480px] lg:h-[500px]">
                {selectedKit?.imageUrl ? (
                  <img
                    src={getImageUrl(selectedKit.imageUrl)}
                    alt={selectedKit.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-8">
                    <Shirt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nessuna immagine presente
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="3d" className="mt-0">
              <div className="rounded-lg bg-muted h-[250px] sm:h-[480px] lg:h-[500px]">
                <KitViewer3D
                  modelUrl={selectedKit?.model3DUrl}
                  className="h-full"
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between items-center pt-3 border-t">
            <div className="text-base font-medium">
              {selectedKitPlayer && (
                <span>Giocatore: <strong className="text-lg">{getPlayerDisplayName(selectedKitPlayer)}</strong></span>
              )}
            </div>
            <Button variant="outline" onClick={() => {
              setSelectedKit(null);
              setSelectedKitPlayer(null);
              setPlayerKitsList([]);
            }}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Player Detail Dialog */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col dialog-custom-color">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-3">
              <BookOpen className="w-8 h-8" />
              Biografia
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-6 flex-1 overflow-hidden">
            {/* Colonna sinistra: Immagine */}
            <div className="flex-shrink-0 flex sm:block justify-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-muted border-2 border-primary/20 shadow-xl biography-img-custom-border">
                {selectedPlayer?.image ? (
                  <img
                    src={getImageUrl(selectedPlayer.image)}
                    alt={getPlayerDisplayName(selectedPlayer!)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                      <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                        {selectedPlayer && (selectedPlayer.name[0] + (selectedPlayer.surname?.[0] || '')).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
              </div>
            </div>

            {/* Colonna destra: Contenuto */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Nome e nazionalità */}
              <div className="text-center sm:text-left space-y-2 mb-4 flex-shrink-0">
                <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {selectedPlayer && getPlayerDisplayName(selectedPlayer)}
                </h2>
                {selectedPlayer?.Nation && (
                  <Badge variant="secondary" className="text-sm items-center gap-2">
                    <Flag code={convertAlpha3ToAlpha2(selectedPlayer.Nation.code)} className="w-5 h-4 object-cover" />
                    {selectedPlayer.Nation.name}
                  </Badge>
                )}
              </div>

              <Separator className="flex-shrink-0" />

              {/* Biografia con ScrollArea */}
              <div className="flex-1 overflow-hidden mt-4 min-h-0">
                <ScrollArea className="h-full">
                  {selectedPlayer?.biography ? (
                    isUrl(selectedPlayer.biography) ? (
                      <div className="py-6">
                        <Button
                          onClick={() => window.open(selectedPlayer.biography, '_blank', 'noopener,noreferrer')}
                          size="lg"
                          className="gap-2"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Vai alla biografia su Wikipedia
                        </Button>
                      </div>
                    ) : (
                      <div className="prose dark:prose-invert max-w-none bg-muted/50 rounded-lg p-4 sm:p-6">
                        <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                          {renderTextWithLinks(selectedPlayer.biography)}
                        </div>
                      </div>
                    )
                  ) : (
                    <div className="py-8 text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                      <BookOpen className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-center">Nessuna biografia disponibile</p>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-4 border-t flex-shrink-0">
            <Button onClick={() => setSelectedPlayer(null)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-background border-t py-3 px-4 mt-auto footer">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2026 GK Retro Kits. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>


  );
}
