'use client';

import { useState } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player, Nation, ContentStatus, CONTENT_STATUS_LABELS } from './types';
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
  biography: string;
  status: ContentStatus;
  // Dati immagine in base64
  imageData: string | null;
  imageMimeType: string | null;
}

// Helper per convertire File in base64
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Rimuovi il prefisso "data:mime;base64,"
      const base64 = result.split(',')[1];
      resolve({ data: base64, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Status badge colors for table display
const getStatusBadgeStyle = (status?: ContentStatus) => {
  switch (status) {
    case 'NUOVO':
      return 'bg-green-500 text-white';
    case 'AGGIORNATO':
      return 'bg-amber-500 text-white';
    default:
      return '';
  }
};

// Helper per ottenere l'URL dell'immagine del giocatore
const getPlayerImageUrl = (playerId: string, updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/players/${playerId}/image${cacheBuster}`;
};

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
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PlayerForm>({
    name: '',
    surname: '',
    nationId: '',
    biography: '',
    status: 'NON_IMPOSTATO',
    imageData: null,
    imageMimeType: null,
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
    setForm({
      name: '',
      surname: '',
      nationId: '',
      biography: '',
      status: 'NON_IMPOSTATO',
      imageData: null,
      imageMimeType: null,
    });
    setNationSearch('');
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setForm({
      name: player.name,
      surname: player.surname || '',
      nationId: player.nationId || '',
      biography: player.biography || '',
      status: player.status || 'NON_IMPOSTATO',
      // Quando modifichi, non carichiamo i dati binari esistenti
      // L'utente può caricare un nuovo file se vuole sostituire
      imageData: null,
      imageMimeType: null,
    });
    setNationSearch('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingPlayer(null);
    setForm({
      name: '',
      surname: '',
      nationId: '',
      biography: '',
      status: 'NON_IMPOSTATO',
      imageData: null,
      imageMimeType: null,
    });
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

    setSaving(true);
    try {
      if (editingPlayer) {
        // Quando modifichi, includi solo i campi binary che hanno nuovi valori
        const updateData: any = {
          name: form.name,
          surname: form.surname,
          nationId: form.nationId || null,
          biography: form.biography || null,
          status: form.status,
        };

        // Aggiungi l'immagine solo se è stata caricata
        if (form.imageData) {
          updateData.imageData = form.imageData;
          updateData.imageMimeType = form.imageMimeType;
        }

        await onUpdatePlayer(editingPlayer.id, updateData);
      } else {
        await onCreatePlayer({
          name: form.name,
          surname: form.surname,
          nationId: form.nationId || null,
          biography: form.biography || null,
          status: form.status,
          imageData: form.imageData,
          imageMimeType: form.imageMimeType,
        });
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving player:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { data, mimeType } = await fileToBase64(file);
        setForm(prev => ({
          ...prev,
          imageData: data,
          imageMimeType: mimeType,
        }));
      } catch (error) {
        console.error('File reading failed:', error);
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
                  <TableHead>Stato</TableHead>
                  <TableHead>Immagine</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-gray-500 py-8">
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
                        {player.status && player.status !== 'NON_IMPOSTATO' ? (
                          <Badge className={getStatusBadgeStyle(player.status)}>
                            {CONTENT_STATUS_LABELS[player.status]}
                          </Badge>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        {player.hasImage ? (
                          <img
                            src={getPlayerImageUrl(player.id, player.updatedAt)}
                            alt={player.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover ring-1 ring-border/50"
                          />
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
        <DialogContent className="w-[95vw] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingPlayer ? 'Modifica Giocatore' : 'Nuovo Giocatore'}
            </DialogTitle>
            <DialogDescription>
              {editingPlayer ? 'Modifica i dettagli del giocatore' : 'Aggiungi un nuovo giocatore'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Nome */}
            <div className="space-y-1.5">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome"
              />
            </div>
            {/* Cognome */}
            <div className="space-y-1.5">
              <Label htmlFor="surname">Cognome *</Label>
              <Input
                id="surname"
                value={form.surname}
                onChange={(e) => setForm({ ...form, surname: e.target.value })}
                placeholder="Cognome"
              />
            </div>
            {/* Stato */}
            <div className="space-y-1.5">
              <Label htmlFor="status">Stato</Label>
              <Select
                value={form.status}
                onValueChange={(value: ContentStatus) => setForm({ ...form, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Seleziona stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NON_IMPOSTATO">Non Impostato</SelectItem>
                  <SelectItem value="NUOVO">Nuovo</SelectItem>
                  <SelectItem value="AGGIORNATO">Aggiornato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Immagine */}
            <div className="space-y-1.5">
              <Label>Immagine Giocatore</Label>
              <Input
                key={`image-${editingPlayer?.id || 'new'}`}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
              />
              {form.imageData ? (
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={`data:${form.imageMimeType};base64,${form.imageData}`}
                    alt="Preview"
                    className="w-8 h-8 rounded object-cover border"
                  />
                  <span className="text-xs text-muted-foreground">Nuovo file</span>
                </div>
              ) : editingPlayer?.hasImage ? (
                <div className="flex items-center gap-2 mt-1">
                  <img
                    src={getPlayerImageUrl(editingPlayer.id, editingPlayer.updatedAt)}
                    alt="Current"
                    className="w-8 h-8 rounded object-cover border"
                  />
                  <span className="text-xs text-muted-foreground">File presente</span>
                </div>
              ) : null}
            </div>
            {/* Nazione - occupa 2 colonne */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="nation">
                {form.nationId && nations.find(n => n.id === form.nationId)
                  ? `Nazione: ${nations.find(n => n.id === form.nationId)?.name}`
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
              <div className="max-h-40 overflow-y-auto border rounded-md text-sm">
                {nations
                  .filter(n => n.name.toLowerCase().includes(nationSearch.toLowerCase()))
                  .map((nation) => (
                    <div
                      key={nation.id}
                      className={`px-3 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${form.nationId === nation.id ? 'bg-gray-100 dark:bg-gray-800' : ''
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
            {/* Biografia - occupa 2 colonne */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="biography">Biografia</Label>
              <p className="text-xs text-muted-foreground">
                Inserisci una biografia testuale o un link a Wikipedia
              </p>
              <Textarea
                id="biography"
                value={form.biography}
                onChange={(e) => setForm({ ...form, biography: e.target.value })}
                placeholder="Es: https://it.wikipedia.org/wiki/Lionel_Messi"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="mt-3">
            <Button variant="outline" onClick={handleCloseDialog} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                editingPlayer ? 'Aggiorna' : 'Crea'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
