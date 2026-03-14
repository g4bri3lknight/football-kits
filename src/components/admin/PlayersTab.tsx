'use client';

import { useState } from 'react';
import { getImageUrl } from '@/lib/image-url';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player, Nation } from './types';
import Flag from 'react-world-flags';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';

interface PlayersTabProps {
  players: Player[];
  nations: Nation[];
  uploading: boolean;
  onUpload: (file: File, folder: string) => Promise<string>;
  onCreatePlayer: (playerData: any) => Promise<void>;
  onUpdatePlayer: (playerId: string, playerData: any) => Promise<void>;
  onDeletePlayer: (playerId: string) => void;
}

interface PlayerForm {
  name: string;
  surname: string;
  nationId: string;
  image: string;
  biography: string;
}

export default function PlayersTab({
  players,
  nations,
  uploading,
  onUpload,
  onCreatePlayer,
  onUpdatePlayer,
  onDeletePlayer,
}: PlayersTabProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [nationFilter, setNationFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [form, setForm] = useState<PlayerForm>({
    name: '',
    surname: '',
    nationId: '',
    image: '',
    biography: '',
  });
  const [nationSearch, setNationSearch] = useState('');

  const filteredPlayers = players.filter(player => {
    const matchesName = player.name.toLowerCase().includes(search.toLowerCase()) ||
      (player.surname && player.surname.toLowerCase().includes(search.toLowerCase()));
    const matchesNation = !nationFilter ||
      (player.Nation && player.Nation.name.toLowerCase().includes(nationFilter.toLowerCase()));
    return matchesName && matchesNation;
  });

  const handleOpenNewDialog = () => {
    setEditingPlayer(null);
    setForm({ name: '', surname: '', nationId: '', image: '', biography: '' });
    setNationSearch('');
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setForm({
      name: player.name,
      surname: player.surname || '',
      nationId: player.nationId || '',
      image: player.image || '',
      biography: player.biography || '',
    });
    setNationSearch('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingPlayer(null);
    setForm({ name: '', surname: '', nationId: '', image: '', biography: '' });
    setNationSearch('');
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.surname) {
      toast({
        title: 'Errore',
        description: 'Nome e cognome sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingPlayer) {
        await onUpdatePlayer(editingPlayer.id, {
          name: form.name,
          surname: form.surname,
          nationId: form.nationId || null,
          image: form.image,
          biography: form.biography || null,
        });
      } else {
        await onCreatePlayer({
          name: form.name,
          surname: form.surname,
          nationId: form.nationId || null,
          image: form.image,
          biography: form.biography || null,
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving player:', error);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await onUpload(file, 'players');
        setForm({ ...form, image: url });
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto space-y-2">
          <h3 className="text-lg font-semibold">Lista Giocatori</h3>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca per cognome..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
            <div className="relative flex-1 sm:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Filtra per nazionalità..."
                value={nationFilter}
                onChange={(e) => setNationFilter(e.target.value)}
                className="pl-10 w-full sm:w-64"
              />
            </div>
          </div>
        </div>
        <Button onClick={handleOpenNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Giocatore
        </Button>
      </div>

      {/* Players Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
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
                    {search || nationFilter ? 'Nessun risultato trovato' : 'Nessun giocatore presente'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlayers.map((player) => (
                  <TableRow key={player.id}>
                    <TableCell className="font-medium">{player.name}</TableCell>
                    <TableCell>{player.surname || '-'}</TableCell>
                    <TableCell>
                      {player.Nation ? (
                        <div className="flex items-center gap-2">
                          <Flag code={convertAlpha3ToAlpha2(player.Nation.code)} className="w-4 h-3 object-cover" />
                          {player.Nation.name}
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>
                      {player.image ? (
                        <img src={getImageUrl(player.image)} alt={player.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover ring-1 ring-border/50" />
                      ) : (
                        <span className="text-gray-400 text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(player)}
                          className="h-8 w-8 sm:h-9 sm:w-9"
                        >
                          <Pencil className="w-3 h-3 sm:w-4 sm:h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                              <Trash2 className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
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
                              <AlertDialogAction onClick={() => onDeletePlayer(player.id)}>
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
        </div>
        </CardContent>
      </Card>

      {/* Player Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {editingPlayer ? 'Modifica Giocatore' : 'Nuovo Giocatore'}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer ? 'Modifica i dettagli del giocatore' : 'Aggiungi un nuovo giocatore'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Nome"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname">Cognome *</Label>
                <Input
                  id="surname"
                  value={form.surname}
                  onChange={(e) => setForm({ ...form, surname: e.target.value })}
                  placeholder="Cognome"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nation">
                {form.nationId && nations.find(n => n.id === form.nationId)
                  ? `Nazione selezionata: ${nations.find(n => n.id === form.nationId)?.name}`
                  : 'Nazione'}
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="nation"
                  placeholder="Cerca nazionalità..."
                  value={nationSearch}
                  onChange={(e) => setNationSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-40 overflow-y-auto border rounded-md">
                {nations
                  .filter(n => n.name.toLowerCase().includes(nationSearch.toLowerCase()))
                  .map((nation) => (
                    <div
                      key={nation.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                        form.nationId === nation.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                      onClick={() => setForm({ ...form, nationId: nation.id })}
                    >
                      <span className="flex items-center gap-2">
                        <Flag code={convertAlpha3ToAlpha2(nation.code)} className="w-4 h-3 object-cover" />
                        {nation.name}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">URL Immagine</Label>
              <Input
                id="image"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                placeholder="/path/to/image.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Oppure carica un'immagine</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
              {form.image && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Anteprima:</p>
                  <img
                    src={getImageUrl(form.image)}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="biography">Biografia</Label>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Inserisci una biografia testuale o un link a Wikipedia
              </p>
              <Textarea
                id="biography"
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                placeholder="Es: https://it.wikipedia.org/wiki/Lionel_Messi o una biografia personalizzata..."
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annulla
            </Button>
            <Button onClick={handleSubmit}>
              {editingPlayer ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
