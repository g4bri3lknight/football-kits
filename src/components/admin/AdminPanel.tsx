'use client';

import { useState, useEffect } from 'react';
import { getImageUrl } from '@/lib/image-url';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, User as UserIcon, Shirt, Link2, Upload, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
  player: Player;
  kit: Kit;
}

interface AdminPanelProps {
  onClose?: () => void;
  onUpdate?: () => void;
}

export default function AdminPanel({ onClose, onUpdate }: AdminPanelProps) {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [playerKits, setPlayerKits] = useState<PlayerKit[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload states
  const [uploading, setUploading] = useState(false);

  // Search states
  const [playerSearch, setPlayerSearch] = useState('');
  const [playerNationFilter, setPlayerNationFilter] = useState('');
  const [kitSearch, setKitSearch] = useState({ season: '', team: '', type: '' });
  const [associationSearch, setAssociationSearch] = useState({ player: '', season: '', team: '' });

  // Dialog states
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [kitDialogOpen, setKitDialogOpen] = useState(false);
  const [associationDialogOpen, setAssociationDialogOpen] = useState(false);

  // Player form state
  const [playerForm, setPlayerForm] = useState({
    name: '',
    surname: '',
    nationId: '',
    image: '',
  });
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Kit form state
  const [kitForm, setKitForm] = useState({
    name: '',
    team: '',
    type: 'home',
    imageUrl: '',
    model3DUrl: '',
    logoUrl: '',
  });
  const [editingKit, setEditingKit] = useState<Kit | null>(null);

  // PlayerKit form state
  const [playerKitForm, setPlayerKitForm] = useState({
    playerId: '',
    kitId: '',
  });
  // Dialog search states
  const [dialogPlayerSearch, setDialogPlayerSearch] = useState('');
  const [dialogKitSearch, setDialogKitSearch] = useState('');
  const [nationSearch, setNationSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, kitsRes, playerKitsRes, nationsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/kits'),
        fetch('/api/player-kits'),
        fetch('/api/nations'),
      ]);

      const [playersData, kitsData, playerKitsData, nationsData] = await Promise.all([
        playersRes.json(),
        kitsRes.json(),
        playerKitsRes.json(),
        nationsRes.json(),
      ]);

      setPlayers(playersData);
      setKits(kitsData);
      setPlayerKits(playerKitsData);
      setNations(nationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Upload file function
  const handleFileUpload = async (file: File, folder: string = 'uploads'): Promise<string> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il file',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Kit type translation
  const translateKitType = (type: string): string => {
    const translations: Record<string, string> = {
      home: 'Casa',
      away: 'Trasfetta',
      third: 'Terza',
      goalkeeper: 'Portiere',
    };
    return translations[type] || type;
  };

  // Reverse translation - Italian to English
  const reverseTranslateKitType = (italianType: string): string => {
    const reverseTranslations: Record<string, string> = {
      casa: 'home',
      trasfetta: 'away',
      terza: 'third',
      portiere: 'goalkeeper',
    };
    return reverseTranslations[italianType.toLowerCase()] || italianType;
  };

  // Check if kit type matches search (works with both Italian and English)
  const kitTypeMatches = (kitType: string, searchTerm: string): boolean => {
    const typeLower = kitType.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    // Direct match in English
    if (typeLower.includes(searchLower)) return true;
    
    // Match in Italian translation
    const italianType = translateKitType(kitType).toLowerCase();
    if (italianType.includes(searchLower)) return true;
    
    return false;
  };

  // Utility functions - MUST be defined before filter functions
  const getKitTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      home: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      away: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      third: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      goalkeeper: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  };

  const getPlayerDisplayName = (player: Player): string => {
    return player.surname ? `${player.name} ${player.surname}` : player.name;
  };

  // Filter functions
  const filteredPlayers = players.filter(player => {
    const matchesName = player.name.toLowerCase().includes(playerSearch.toLowerCase()) ||
      (player.surname && player.surname.toLowerCase().includes(playerSearch.toLowerCase()));
    const matchesNation = !playerNationFilter || 
      (player.nation && player.nation.name.toLowerCase().includes(playerNationFilter.toLowerCase()));
    return matchesName && matchesNation;
  });

  const filteredKits = kits.filter(kit =>
    kit.name.toLowerCase().includes(kitSearch.season.toLowerCase()) &&
    kit.team.toLowerCase().includes(kitSearch.team.toLowerCase()) &&
    kitTypeMatches(kit.type, kitSearch.type)
  );

  const filteredAssociations = playerKits.filter(pk => {
    const playerName = getPlayerDisplayName(pk.player).toLowerCase();
    const seasonMatch = pk.kit.name.toLowerCase().includes(associationSearch.season.toLowerCase());
    const teamMatch = pk.kit.team.toLowerCase().includes(associationSearch.team.toLowerCase());
    const playerMatch = playerName.includes(associationSearch.player.toLowerCase());
    
    return playerMatch && seasonMatch && teamMatch;
  });

  // Player CRUD operations
  const handleCreatePlayer = async () => {
    if (!playerForm.name || !playerForm.surname) {
      toast({
        title: 'Errore',
        description: 'Nome e cognome sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerForm.name,
          surname: playerForm.surname,
          nationId: playerForm.nationId || null,
          image: playerForm.image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: 'Giocatore duplicato',
            description: errorData.error || 'Esiste già un giocatore con questi dati',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to create player');
      }

      const newPlayer = await response.json();
      setPlayers([...players, newPlayer]);
      setPlayerForm({ name: '', surname: '', nationId: '', image: '' });
      setPlayerDialogOpen(false);

      toast({
        title: 'Successo',
        description: 'Giocatore creato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error creating player:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile creare il giocatore',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    if (!playerForm.name || !playerForm.surname) {
      toast({
        title: 'Errore',
        description: 'Nome e cognome sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/players/${editingPlayer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerForm.name,
          surname: playerForm.surname,
          nationId: playerForm.nationId || null,
          image: playerForm.image,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: 'Giocatore duplicato',
            description: errorData.error || 'Esiste già un giocatore con questi dati',
            variant: 'destructive',
          });
          return;
        }
        throw new Error(errorData.error || 'Failed to update player');
      }

      const updatedPlayer = await response.json();
      setPlayers(players.map((p) => (p.id === editingPlayer.id ? updatedPlayer : p)));
      setEditingPlayer(null);
      setPlayerForm({ name: '', surname: '', nationId: '', image: '' });
      setPlayerDialogOpen(false);

      toast({
        title: 'Successo',
        description: 'Giocatore aggiornato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare il giocatore',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlayer = async (id: string) => {
    try {
      await fetch(`/api/players/${id}`, { method: 'DELETE' });
      setPlayers(players.filter((p) => p.id !== id));

      toast({
        title: 'Successo',
        description: 'Giocatore eliminato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il giocatore',
        variant: 'destructive',
      });
    }
  };

  const startEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({
      name: player.name,
      surname: player.surname || '',
      nationId: player.nationId || '',
      image: player.image || '',
    });
    setPlayerDialogOpen(true);
  };

  const openNewPlayerDialog = () => {
    setEditingPlayer(null);
    setPlayerForm({ name: '', surname: '', nationId: '', image: '' });
    setPlayerDialogOpen(true);
  };

  const closePlayerDialog = () => {
    setEditingPlayer(null);
    setPlayerForm({ name: '', surname: '', nationId: '', image: '' });
    setPlayerDialogOpen(false);
  };

  // Kit CRUD operations
  const handleCreateKit = async () => {
    if (!kitForm.name || !kitForm.team || !kitForm.type) {
      toast({
        title: 'Errore',
        description: 'Stagione, squadra/nazionale e tipo sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitForm),
      });

      if (!response.ok) throw new Error('Failed to create kit');

      const newKit = await response.json();
      setKits([...kits, newKit]);
      setKitForm({ name: '', team: '', type: 'home', imageUrl: '', model3DUrl: '', logoUrl: '' });
      setKitDialogOpen(false);

      toast({
        title: 'Successo',
        description: 'Kit creato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error creating kit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile creare il kit',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateKit = async () => {
    if (!editingKit) return;

    if (!kitForm.name || !kitForm.team || !kitForm.type) {
      toast({
        title: 'Errore',
        description: 'Stagione, squadra/nazionale e tipo sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/kits/${editingKit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitForm),
      });

      if (!response.ok) throw new Error('Failed to update kit');

      const updatedKit = await response.json();
      setKits(kits.map((k) => (k.id === editingKit.id ? updatedKit : k)));
      setEditingKit(null);
      setKitForm({ name: '', team: '', type: 'home', imageUrl: '', model3DUrl: '', logoUrl: '' });
      setKitDialogOpen(false);

      toast({
        title: 'Successo',
        description: 'Kit aggiornato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating kit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare il kit',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteKit = async (id: string) => {
    try {
      await fetch(`/api/kits/${id}`, { method: 'DELETE' });
      setKits(kits.filter((k) => k.id !== id));

      toast({
        title: 'Successo',
        description: 'Kit eliminato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting kit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il kit',
        variant: 'destructive',
      });
    }
  };

  const startEditKit = (kit: Kit) => {
    setEditingKit(kit);
    setKitForm({
      name: kit.name,
      team: kit.team,
      type: kit.type,
      imageUrl: kit.imageUrl || '',
      model3DUrl: kit.model3DUrl || '',
      logoUrl: kit.logoUrl || '',
    });
    setKitDialogOpen(true);
  };

  const openNewKitDialog = () => {
    setEditingKit(null);
    setKitForm({ name: '', team: '', type: 'home', imageUrl: '', model3DUrl: '', logoUrl: '' });
    setKitDialogOpen(true);
  };

  const closeKitDialog = () => {
    setEditingKit(null);
    setKitForm({ name: '', team: '', type: 'home', imageUrl: '', model3DUrl: '', logoUrl: '' });
    setKitDialogOpen(false);
  };

  // PlayerKit operations
  const handleCreatePlayerKit = async () => {
    if (!playerKitForm.playerId || !playerKitForm.kitId) {
      toast({
        title: 'Errore',
        description: 'Giocatore e kit sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    // Check if association already exists
    const existingAssociation = playerKits.find(
      pk => pk.playerId === playerKitForm.playerId && pk.kitId === playerKitForm.kitId
    );

    if (existingAssociation) {
      const player = players.find(p => p.id === playerKitForm.playerId);
      const kit = kits.find(k => k.id === playerKitForm.kitId);
      const playerName = player ? getPlayerDisplayName(player) : 'Giocatore';
      const kitName = kit ? `${kit.name} - ${kit.team}` : 'Kit';
      
      toast({
        title: 'Associazione già esistente',
        description: `L'associazione tra ${playerName} e ${kitName} esiste già`,
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/player-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerKitForm),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create player kit');
      }

      const newPlayerKit = await response.json();
      setPlayerKits([...playerKits, newPlayerKit]);
      setPlayerKitForm({
        playerId: '',
        kitId: '',
      });
      setAssociationDialogOpen(false);

      toast({
        title: 'Successo',
        description: 'Associazione creata con successo',
      });
      onUpdate?.();
    } catch (error: any) {
      console.error('Error creating player kit:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare l\'associazione',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePlayerKit = async (id: string) => {
    try {
      await fetch(`/api/player-kits/${id}`, { method: 'DELETE' });
      setPlayerKits(playerKits.filter((pk) => pk.id !== id));

      toast({
        title: 'Successo',
        description: 'Associazione eliminata con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting player kit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'associazione',
        variant: 'destructive',
      });
    }
  };

  const openNewAssociationDialog = () => {
    setPlayerKitForm({ playerId: '', kitId: '' });
    setDialogPlayerSearch('');
    setDialogKitSearch('');
    setAssociationDialogOpen(true);
  };

  const closeAssociationDialog = () => {
    setPlayerKitForm({ playerId: '', kitId: '' });
    setDialogPlayerSearch('');
    setDialogKitSearch('');
    setAssociationDialogOpen(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Pannello di Amministrazione</CardTitle>
          <CardDescription>
            Gestisci giocatori, kit e le loro associazioni
          </CardDescription>
        </CardHeader>
        <CardContent>

      <Tabs defaultValue="players" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="players" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            Giocatori
          </TabsTrigger>
          <TabsTrigger value="kits" className="flex items-center gap-2">
            <Shirt className="w-4 h-4" />
            Kit
          </TabsTrigger>
          <TabsTrigger value="associations" className="flex items-center gap-2">
            <Link2 className="w-4 h-4" />
            Associazioni
          </TabsTrigger>
        </TabsList>

        {/* Players Tab */}
        <TabsContent value="players" className="mt-4 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1 w-full sm:w-auto space-y-2">
              <h3 className="text-lg font-semibold">Lista Giocatori</h3>
              <div className="flex gap-2">
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca per cognome..."
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
                <div className="relative flex-1 sm:flex-none">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Filtra per nazionalità..."
                    value={playerNationFilter}
                    onChange={(e) => setPlayerNationFilter(e.target.value)}
                    className="pl-10 w-full sm:w-64"
                  />
                </div>
              </div>
            </div>
            <Button onClick={openNewPlayerDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Giocatore
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cognome</TableHead>
                    <TableHead>Nazione</TableHead>
                    <TableHead>Immagine</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        {playerSearch ? 'Nessun risultato trovato' : 'Nessun giocatore presente'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPlayers.map((player) => (
                      <TableRow key={player.id}>
                        <TableCell className="font-medium">{player.name}</TableCell>
                        <TableCell>{player.surname || '-'}</TableCell>
                        <TableCell>{player.nation?.name || '-'}</TableCell>
                        <TableCell>
                          {player.image ? (
                            <img src={getImageUrl(player.image)} alt={player.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditPlayer(player)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione eliminerà il giocatore e tutte le sue associazioni con i kit.
                                    Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePlayer(player.id)}>
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Kits Tab */}
        <TabsContent value="kits" className="mt-4 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 w-full">
              <h3 className="text-lg font-semibold mb-2">Lista Kit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca stagione..."
                    value={kitSearch.season}
                    onChange={(e) => setKitSearch({ ...kitSearch, season: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca squadra/nazionale..."
                    value={kitSearch.team}
                    onChange={(e) => setKitSearch({ ...kitSearch, team: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca tipo..."
                    value={kitSearch.type}
                    onChange={(e) => setKitSearch({ ...kitSearch, type: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <Button onClick={openNewKitDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Aggiungi Kit
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Stagione</TableHead>
                    <TableHead>Squadra/Nazionale</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKits.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        {kitSearch.season || kitSearch.team || kitSearch.type ? 'Nessun risultato trovato' : 'Nessun kit presente'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredKits.map((kit) => (
                      <TableRow key={kit.id}>
                        <TableCell className="font-medium">{kit.name}</TableCell>
                        <TableCell>{kit.team}</TableCell>
                        <TableCell>
                          <Badge className={getKitTypeColor(kit.type)} variant="secondary">
                            {translateKitType(kit.type)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditKit(kit)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione eliminerà il kit e tutte le sue associazioni con i giocatori.
                                    Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteKit(kit.id)}>
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Associations Tab */}
        <TabsContent value="associations" className="mt-4 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1 w-full">
              <h3 className="text-lg font-semibold mb-2">Associazioni Giocatori-Kit</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca giocatore..."
                    value={associationSearch.player}
                    onChange={(e) => setAssociationSearch({ ...associationSearch, player: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca stagione..."
                    value={associationSearch.season}
                    onChange={(e) => setAssociationSearch({ ...associationSearch, season: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Cerca squadra/nazionale..."
                    value={associationSearch.team}
                    onChange={(e) => setAssociationSearch({ ...associationSearch, team: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <Button onClick={openNewAssociationDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Nuova Associazione
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Giocatore</TableHead>
                    <TableHead>Stagione</TableHead>
                    <TableHead>Squadra/Nazionale</TableHead>
                    <TableHead className="text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssociations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-8">
                        {associationSearch.player || associationSearch.season || associationSearch.team ? 'Nessun risultato trovato' : 'Nessuna associazione presente'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAssociations.map((playerKit) => (
                      <TableRow key={playerKit.id}>
                        <TableCell className="font-medium">{getPlayerDisplayName(playerKit.player)}</TableCell>
                        <TableCell>{playerKit.kit.name}</TableCell>
                        <TableCell>{playerKit.kit.team}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Questa azione eliminerà l'associazione tra il giocatore e il kit.
                                    Questa azione non può essere annullata.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeletePlayerKit(playerKit.id)}>
                                    Elimina
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </CardContent>
      </Card>

      {/* Player Dialog */}
      <Dialog open={playerDialogOpen} onOpenChange={setPlayerDialogOpen}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlayer ? 'Modifica Giocatore' : 'Aggiungi Giocatore'}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer
                ? 'Modifica le informazioni del giocatore'
                : 'Inserisci le informazioni del nuovo giocatore'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="playerName">Nome *</Label>
                <Input
                  id="playerName"
                  value={playerForm.name}
                  onChange={(e) => setPlayerForm({ ...playerForm, name: e.target.value })}
                  placeholder="Es: Lionel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="playerSurname">Cognome *</Label>
                <Input
                  id="playerSurname"
                  value={playerForm.surname}
                  onChange={(e) => setPlayerForm({ ...playerForm, surname: e.target.value })}
                  placeholder="Es: Messi"
                />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="playerNation">Nazione</Label>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="playerNationSearch"
                      value={nationSearch}
                      onChange={(e) => setNationSearch(e.target.value)}
                      placeholder="Cerca nazione..."
                      className="pl-10"
                    />
                  </div>
                  <Select
                    value={playerForm.nationId}
                    onValueChange={(value) => setPlayerForm({ ...playerForm, nationId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona una nazione" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60 overflow-y-auto">
                      {nations
                        .filter(n => 
                          !nationSearch || 
                          n.name.toLowerCase().includes(nationSearch.toLowerCase()) ||
                          n.code.toLowerCase().includes(nationSearch.toLowerCase())
                        )
                        .map((nation) => (
                          <SelectItem key={nation.id} value={nation.id}>
                            {nation.name} ({nation.code})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="playerImage">Immagine</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="playerImage"
                    value={playerForm.image}
                    onChange={(e) => setPlayerForm({ ...playerForm, image: e.target.value })}
                    placeholder="https://... o carica file"
                  />
                  {playerForm.image && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setPlayerForm({ ...playerForm, image: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="playerImageFile" className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600">
                    <Upload className="w-4 h-4" />
                    Carica dal PC
                  </Label>
                  <Input
                    id="playerImageFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await handleFileUpload(file, 'players');
                          setPlayerForm({ ...playerForm, image: url });
                        } catch (err) {
                          console.error('Upload failed:', err);
                        }
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-gray-500">Caricamento...</span>}
                </div>
                {playerForm.image && (
                  <div className="mt-2">
                    <img src={getImageUrl(playerForm.image)} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closePlayerDialog}>
              Annulla
            </Button>
            <Button onClick={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}>
              {editingPlayer ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kit Dialog */}
      <Dialog open={kitDialogOpen} onOpenChange={setKitDialogOpen}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingKit ? 'Modifica Kit' : 'Aggiungi Kit'}
            </DialogTitle>
            <DialogDescription>
              {editingKit
                ? 'Modifica le informazioni del kit'
                : 'Inserisci le informazioni del nuovo kit'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="kitName">Stagione *</Label>
              <Input
                id="kitName"
                value={kitForm.name}
                onChange={(e) => setKitForm({ ...kitForm, name: e.target.value })}
                placeholder="Es: 2000-01"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kitTeam">Squadra/Nazionale *</Label>
              <Input
                id="kitTeam"
                value={kitForm.team}
                onChange={(e) => setKitForm({ ...kitForm, team: e.target.value })}
                placeholder="Es: Juventus, Italia"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="kitLogoUrl">Logo Squadra/Nazionale</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="kitLogoUrl"
                    value={kitForm.logoUrl}
                    onChange={(e) => setKitForm({ ...kitForm, logoUrl: e.target.value })}
                    placeholder="https://... o carica file"
                  />
                  {kitForm.logoUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setKitForm({ ...kitForm, logoUrl: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="kitLogoFile" className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600">
                    <Upload className="w-4 h-4" />
                    Carica dal PC
                  </Label>
                  <Input
                    id="kitLogoFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await handleFileUpload(file, 'logos');
                          setKitForm({ ...kitForm, logoUrl: url });
                        } catch (err) {
                          console.error('Upload failed:', err);
                        }
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-gray-500">Caricamento...</span>}
                </div>
                {kitForm.logoUrl && (
                  <div className="mt-2">
                    <img src={getImageUrl(kitForm.logoUrl)} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-muted p-2" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kitType">Tipo *</Label>
              <Select value={kitForm.type} onValueChange={(value) => setKitForm({ ...kitForm, type: value })}>
                <SelectTrigger id="kitType">
                  <SelectValue placeholder="Seleziona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Casa</SelectItem>
                  <SelectItem value="away">Trasferta</SelectItem>
                  <SelectItem value="third">Terza</SelectItem>
                  <SelectItem value="goalkeeper">Portiere</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kitImageUrl">Immagine</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="kitImageUrl"
                    value={kitForm.imageUrl}
                    onChange={(e) => setKitForm({ ...kitForm, imageUrl: e.target.value })}
                    placeholder="https://... o carica file"
                  />
                  {kitForm.imageUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setKitForm({ ...kitForm, imageUrl: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="kitImageFile" className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600">
                    <Upload className="w-4 h-4" />
                    Carica dal PC
                  </Label>
                  <Input
                    id="kitImageFile"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await handleFileUpload(file, 'kits');
                          setKitForm({ ...kitForm, imageUrl: url });
                        } catch (err) {
                          console.error('Upload failed:', err);
                        }
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-gray-500">Caricamento...</span>}
                </div>
                {kitForm.imageUrl && (
                  <div className="mt-2">
                    <img src={getImageUrl(kitForm.imageUrl)} alt="Preview" className="w-20 h-20 rounded-lg object-cover" />
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kitModel3DUrl">Modello 3D</Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    id="kitModel3DUrl"
                    value={kitForm.model3DUrl}
                    onChange={(e) => setKitForm({ ...kitForm, model3DUrl: e.target.value })}
                    placeholder="https://... o carica file"
                  />
                  {kitForm.model3DUrl && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => setKitForm({ ...kitForm, model3DUrl: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Label htmlFor="kitModel3DFile" className="cursor-pointer flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-emerald-600">
                    <Upload className="w-4 h-4" />
                    Carica dal PC
                  </Label>
                  <Input
                    id="kitModel3DFile"
                    type="file"
                    accept=".glb,.gltf"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const url = await handleFileUpload(file, 'models');
                          setKitForm({ ...kitForm, model3DUrl: url });
                        } catch (err) {
                          console.error('Upload failed:', err);
                        }
                      }
                    }}
                    disabled={uploading}
                  />
                  {uploading && <span className="text-sm text-gray-500">Caricamento...</span>}
                </div>
                {kitForm.model3DUrl && (
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    File: {kitForm.model3DUrl.split('/').pop()}
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeKitDialog}>
              Annulla
            </Button>
            <Button onClick={editingKit ? handleUpdateKit : handleCreateKit}>
              {editingKit ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Association Dialog */}
      <Dialog open={associationDialogOpen} onOpenChange={setAssociationDialogOpen}>
        <DialogContent className="max-w-lg max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuova Associazione</DialogTitle>
            <DialogDescription>
              Associa un kit a un giocatore
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Player selection with search */}
            <div className="space-y-2">
              <Label htmlFor="playerSearch">Cerca Giocatore</Label>
              <Input
                id="playerSearch"
                placeholder="Cerca per nome o cognome..."
                value={dialogPlayerSearch}
                onChange={(e) => setDialogPlayerSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectPlayer">Giocatore *</Label>
              <Select
                value={playerKitForm.playerId}
                onValueChange={(value) => setPlayerKitForm({ ...playerKitForm, playerId: value })}
              >
                <SelectTrigger id="selectPlayer">
                  <SelectValue placeholder="Seleziona giocatore" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {players
                    .filter(player => {
                      if (!dialogPlayerSearch) return true;
                      const playerName = getPlayerDisplayName(player).toLowerCase();
                      return playerName.includes(dialogPlayerSearch.toLowerCase());
                    })
                    .map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {getPlayerDisplayName(player)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Kit selection with search */}
            <div className="space-y-2">
              <Label htmlFor="kitSearch">Cerca Kit</Label>
              <Input
                id="kitSearch"
                placeholder="Cerca per stagione, squadra/nazionale o tipo..."
                value={dialogKitSearch}
                onChange={(e) => setDialogKitSearch(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="selectKit">Kit *</Label>
              <Select
                value={playerKitForm.kitId}
                onValueChange={(value) => setPlayerKitForm({ ...playerKitForm, kitId: value })}
              >
                <SelectTrigger id="selectKit">
                  <SelectValue placeholder="Seleziona kit" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {kits
                    .filter(kit => {
                      if (!dialogKitSearch) return true;
                      const nameMatch = kit.name.toLowerCase().includes(dialogKitSearch.toLowerCase());
                      const teamMatch = kit.team.toLowerCase().includes(dialogKitSearch.toLowerCase());
                      const typeMatch = kitTypeMatches(kit.type, dialogKitSearch);
                      return nameMatch || teamMatch || typeMatch;
                    })
                    .map((kit) => (
                      <SelectItem key={kit.id} value={kit.id}>
                        {kit.name} - {kit.team} ({translateKitType(kit.type)})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAssociationDialog}>
              Annulla
            </Button>
            <Button onClick={handleCreatePlayerKit}>
              Crea Associazione
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
