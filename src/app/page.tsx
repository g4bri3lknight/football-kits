'use client';

import { useEffect, useState } from 'react';
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
import { Search, Shirt, User as UserIcon, Settings } from 'lucide-react';
import KitViewer3D from '@/components/KitViewer3D';


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
  nation?: Nation | null;
  image?: string;
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
  kit: Kit;
}

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [playerNationFilter, setPlayerNationFilter] = useState('all');
  const [kitSeasonFilter, setKitSeasonFilter] = useState('');
  const [kitTeamFilter, setKitTeamFilter] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);

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

  const handleKitClick = (kit: Kit) => {
    setSelectedKit(kit);
  };

  // Funzione per filtrare i kit di un player
  const filterPlayerKits = (player: Player) => {
    return player.PlayerKit.filter(pk => {
      const matchesSeason = !kitSeasonFilter || 
        pk.kit.name.toLowerCase().includes(kitSeasonFilter.toLowerCase());
      const matchesTeam = !kitTeamFilter || 
        pk.kit.team.toLowerCase().includes(kitTeamFilter.toLowerCase());
      return matchesSeason && matchesTeam;
    });
  };

  const getKitTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      home: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      away: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      third: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      goalkeeper: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const handleAdminClick = () => {
    window.location.href = '/admin/login';
  };

  const translateKitType = (type: string): string => {
    const translations: Record<string, string> = {
      home: 'Casa',
      away: 'Trasferta',
      third: 'Terza',
      goalkeeper: 'Portiere',
    };
    return translations[type] || type;
  };

  const getPlayerDisplayName = (player: Player): string => {
    return player.surname ? `${player.name} ${player.surname}` : player.name;
  };



  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted">
      {/* Header */}
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-48 rounded-lg overflow-hidden flex-shrink-0 bg-background">
                <img
                  src={getImageUrl('/upload/GK-retro-Kits.png')}
                  alt="GK retro Kits"
                  className="h-full w-auto object-contain"
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
          <div className="mt-4 space-y-3">
            {/* Filtro ricerca giocatori e nazionalità */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Cerca giocatore..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={playerNationFilter}
                  onValueChange={setPlayerNationFilter}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Filtra per nazionalità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le nazionalità</SelectItem>
                    {nations.map((nation) => (
                      <SelectItem key={nation.id} value={nation.id}>
                        {nation.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filtri kit */}
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtra per stagione..."
                  value={kitSeasonFilter}
                  onChange={(e) => setKitSeasonFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="relative flex-1 min-w-[180px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Filtra per squadra/nazionale..."
                  value={kitTeamFilter}
                  onChange={(e) => setKitTeamFilter(e.target.value)}
                  className="pl-10"
                />
              </div>
              {(playerNationFilter !== 'all' || kitSeasonFilter || kitTeamFilter || searchQuery) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setPlayerNationFilter('all');
                    setKitSeasonFilter('');
                    setKitTeamFilter('');
                  }}
                >
                  Resetta filtri
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
                className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 hover:border-primary"
                onClick={() => setSelectedPlayer(player)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12 ring-2 ring-primary">
                        <AvatarImage src={getImageUrl(player.image)} alt={player.name} />
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                          {(player.name[0] + (player.surname?.[0] || '')).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{getPlayerDisplayName(player)}</CardTitle>
                        {player.nation && (
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {player.nation.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <Separator />
                <CardContent className="pt-3">
                  <ScrollArea className="h-40 pr-2">
                    <div className="space-y-2">
                      {filterPlayerKits(player).length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nessun kit associato
                        </p>
                      ) : (
                        filterPlayerKits(player).map((playerKit) => (
                          <div
                            key={playerKit.id}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleKitClick(playerKit.kit);
                            }}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                          >
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {playerKit.kit.logoUrl ? (
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                  <img
                                    src={getImageUrl(playerKit.kit.logoUrl)}
                                    alt={`Logo ${playerKit.kit.team}`}
                                    className="w-full h-full object-contain p-1"
                                  />
                                </div>
                              ) : playerKit.kit.imageUrl && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                                  <img
                                    src={getImageUrl(playerKit.kit.imageUrl)}
                                    alt={playerKit.kit.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {playerKit.kit.name} - {playerKit.kit.team}
                                </p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Badge className={getKitTypeColor(playerKit.kit.type)} variant="secondary">
                                    {translateKitType(playerKit.kit.type)}
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

      {/* Overlay blur per i dialog */}
      {(selectedKit || selectedPlayer) && (
        <div className="fixed inset-0 bg-background/30 backdrop-blur-md z-50 pointer-events-none" />
      )}

      {/* Kit Detail Dialog */}
      <Dialog open={!!selectedKit} onOpenChange={() => setSelectedKit(null)}>
        <DialogContent className="!w-[70vw] !max-w-[70vw] max-h-[95vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Shirt className="w-6 h-6 text-primary-foreground" />
              </div>
              {selectedKit?.name}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="image" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="image">Immagine</TabsTrigger>
              <TabsTrigger value="3d">Modello 3D</TabsTrigger>
            </TabsList>
            <TabsContent value="image" className="mt-0">
              <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center min-h-[400px]">
                {selectedKit?.imageUrl ? (
                  <img
                    src={getImageUrl(selectedKit.imageUrl)}
                    alt={selectedKit.name}
                    className="max-w-full max-h-[600px] object-contain"
                  />
                ) : (
                  <div className="text-center p-8">
                    <Shirt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Immagine non disponibile
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="3d" className="mt-0">
              <div className="rounded-lg overflow-hidden bg-background min-h-[800px]">
                <KitViewer3D
                  modelUrl={selectedKit?.model3DUrl}
                  maxZoom={30}
                  minZoom={2}
                  enablePan={true}
                  className="h-[800px]"
                />
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <div className="flex items-center gap-4">
              {selectedKit && (
                <Badge className={getKitTypeColor(selectedKit.type)} variant="secondary">
                  {translateKitType(selectedKit.type)}
                </Badge>
              )}
            </div>
            <Button variant="outline" onClick={() => setSelectedKit(null)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Player Detail Dialog */}
      <Dialog open={!!selectedPlayer} onOpenChange={() => setSelectedPlayer(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-3">
              <Avatar className="w-12 h-12 ring-2 ring-primary">
                <AvatarImage src={getImageUrl(selectedPlayer?.image)} alt={selectedPlayer?.name} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {selectedPlayer && (selectedPlayer.name[0] + (selectedPlayer.surname?.[0] || '')).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="text-foreground">{selectedPlayer && getPlayerDisplayName(selectedPlayer)}</div>
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-3">
              {selectedPlayer?.PlayerKit.length === 0 ? (
                <div className="text-center py-12">
                  <Shirt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nessun kit associato a questo giocatore
                  </p>
                </div>
              ) : (
                selectedPlayer?.PlayerKit.map((playerKit) => (
                  <Card
                    key={playerKit.id}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer"
                    onClick={() => handleKitClick(playerKit.kit)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {playerKit.kit.logoUrl ? (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0 flex items-center justify-center p-2">
                            <img
                              src={getImageUrl(playerKit.kit.logoUrl)}
                              alt={`Logo ${playerKit.kit.team}`}
                              className="w-full h-full object-contain"
                            />
                          </div>
                        ) : playerKit.kit.imageUrl && (
                          <div className="w-20 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            <img
                              src={getImageUrl(playerKit.kit.imageUrl)}
                              alt={playerKit.kit.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="space-y-1">
                            <p className="text-sm font-medium text-foreground">
                              {playerKit.kit.name} - {playerKit.kit.team}
                            </p>
                            <div className="flex items-center gap-1">
                              <Badge className={getKitTypeColor(playerKit.kit.type)} variant="secondary">
                                {translateKitType(playerKit.kit.type)}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-background border-t py-3 px-4 mt-auto">
        <div className="container mx-auto text-center text-sm text-muted-foreground">
          <p>© 2024 GK Retro Kits. Tutti i diritti riservati.</p>
        </div>
      </footer>
    </div>
  );
}