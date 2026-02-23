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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Search, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player, Kit, PlayerKit } from './types';
import { getPlayerDisplayName, getKitTypeColor, translateKitType } from './utils';
import Flag from 'react-world-flags';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';

interface AssociationsTabProps {
  players: Player[];
  kits: Kit[];
  playerKits: PlayerKit[];
  onCreatePlayerKit: (data: { playerId: string; kitId: string }) => Promise<void>;
  onUpdatePlayerKit: (id: string, data: { playerId: string; kitId: string }) => Promise<void>;
  onDeletePlayerKit: (id: string) => void;
}

export default function AssociationsTab({
  players,
  kits,
  playerKits,
  onCreatePlayerKit,
  onUpdatePlayerKit,
  onDeletePlayerKit,
}: AssociationsTabProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState({ player: '', season: '', team: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssociation, setEditingAssociation] = useState<PlayerKit | null>(null);
  const [form, setForm] = useState({ playerId: '', kitId: '' });
  const [playerSearch, setPlayerSearch] = useState('');
  const [kitSearch, setKitSearch] = useState('');

  const filteredAssociations = playerKits.filter(pk => {
    const playerName = getPlayerDisplayName(pk.Player).toLowerCase();
    const seasonMatch = pk.Kit.name.toLowerCase().includes(search.season.toLowerCase());
    const teamMatch = pk.Kit.team.toLowerCase().includes(search.team.toLowerCase());
    const playerMatch = playerName.includes(search.player.toLowerCase());

    return playerMatch && seasonMatch && teamMatch;
  });

  const handleOpenNewDialog = () => {
    setEditingAssociation(null);
    setForm({ playerId: '', kitId: '' });
    setPlayerSearch('');
    setKitSearch('');
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (pk: PlayerKit) => {
    setEditingAssociation(pk);
    setForm({
      playerId: pk.playerId,
      kitId: pk.kitId,
    });
    setPlayerSearch(getPlayerDisplayName(pk.Player));
    setKitSearch(`${pk.Kit.name} ${pk.Kit.team}`);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingAssociation(null);
    setForm({ playerId: '', kitId: '' });
    setPlayerSearch('');
    setKitSearch('');
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.playerId || !form.kitId) {
      toast({
        title: 'Errore',
        description: 'Giocatore e kit sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    // Check if association already exists (only for new associations)
    if (!editingAssociation) {
      const existingAssociation = playerKits.find(
        pk => pk.playerId === form.playerId && pk.kitId === form.kitId
      );

      if (existingAssociation) {
        const player = players.find(p => p.id === form.playerId);
        const kit = kits.find(k => k.id === form.kitId);
        const playerName = player ? getPlayerDisplayName(player) : 'Giocatore';
        const kitName = kit ? `${kit.name} - ${kit.team}` : 'Kit';

        toast({
          title: 'Associazione già esistente',
          description: `L'associazione tra ${playerName} e ${kitName} esiste già`,
          variant: 'destructive',
        });
        return;
      }
    }

    try {
      if (editingAssociation) {
        await onUpdatePlayerKit(editingAssociation.id, form);
      } else {
        await onCreatePlayerKit(form);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving association:', error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex-1 w-full sm:w-auto space-y-2">
          <h3 className="text-lg font-semibold">Lista Associazioni</h3>
          <div className="flex gap-2 flex-wrap">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca giocatore..."
                value={search.player}
                onChange={(e) => setSearch({ ...search, player: e.target.value })}
                className="pl-10 w-40"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca stagione..."
                value={search.season}
                onChange={(e) => setSearch({ ...search, season: e.target.value })}
                className="pl-10 w-40"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca squadra..."
                value={search.team}
                onChange={(e) => setSearch({ ...search, team: e.target.value })}
                className="pl-10 w-40"
              />
            </div>
          </div>
        </div>
        <Button onClick={handleOpenNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Associazione
        </Button>
      </div>

      {/* Associations Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Giocatore</TableHead>
                <TableHead>Nazionalità</TableHead>
                <TableHead>Stagione</TableHead>
                <TableHead>Squadra/Nazionale</TableHead>
                <TableHead>Tipo Kit</TableHead>
                <TableHead className="text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAssociations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                    {(search.player || search.season || search.team) ? 'Nessun risultato trovato' : 'Nessuna associazione presente'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredAssociations.map((pk) => (
                  <TableRow key={pk.id}>
                    <TableCell className="font-medium">{getPlayerDisplayName(pk.Player)}</TableCell>
                    <TableCell>{pk.Player.Nation ? (
                      <div className="flex items-center gap-2">
                        <Flag code={convertAlpha3ToAlpha2(pk.Player.Nation.code)} className="w-4 h-3 object-cover" />
                        {pk.Player.Nation.name}
                      </div>
                    ) : '-'}</TableCell>
                    <TableCell>{pk.Kit.name}</TableCell>
                    <TableCell>{pk.Kit.team}</TableCell>
                    <TableCell>
                      <Badge className={getKitTypeColor(pk.Kit.type)}>
                        {translateKitType(pk.Kit.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditDialog(pk)}
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
                                Questa azione eliminerà l'associazione tra il giocatore e il kit.
                                Questa azione non può essere annullata.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annulla</AlertDialogCancel>
                              <AlertDialogAction onClick={() => onDeletePlayerKit(pk.id)}>
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

      {/* Association Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {editingAssociation ? 'Modifica Associazione' : 'Nuova Associazione'}
            </DialogTitle>
            <DialogDescription>
              {editingAssociation ? 'Modifica l\'associazione tra giocatore e kit' : 'Associa un giocatore a un kit'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div>
                <Label htmlFor="player">Giocatore *</Label>
                {form.playerId && (
                  <div className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    Giocatore selezionato: <strong>
                      {getPlayerDisplayName(players.find(p => p.id === form.playerId) || { name: '' })}
                    </strong>
                  </div>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="player"
                  placeholder="Cerca giocatore..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {players
                  .filter(p => getPlayerDisplayName(p).toLowerCase().includes(playerSearch.toLowerCase()))
                  .map((player) => (
                    <div
                      key={player.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 ${
                        form.playerId === player.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                      onClick={() => setForm({ ...form, playerId: player.id })}
                    >
                      {player.image && (
                        <img src={getImageUrl(player.image)} alt={player.name} className="w-8 h-8 rounded-lg object-cover ring-1 ring-border/50" />
                      )}
                      <div>
                        <div className="font-medium">{getPlayerDisplayName(player)}</div>
                        {player.Nation && (
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {player.Nation.flag && <span className="mr-1">{player.Nation.flag}</span>}
                            {player.Nation.name}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor="kit">Kit *</Label>
                {form.kitId && (
                  <div className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
                    Kit selezionato: <strong>
                      {(() => {
                        const kit = kits.find(k => k.id === form.kitId);
                        return kit ? `${kit.name} - ${kit.team}` : '';
                      })()}
                    </strong>
                  </div>
                )}
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="kit"
                  placeholder="Cerca kit..."
                  value={kitSearch}
                  onChange={(e) => setKitSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="max-h-48 overflow-y-auto border rounded-md">
                {kits
                  .filter(k =>
                    `${k.name} ${k.team} ${translateKitType(k.type)}`.toLowerCase().includes(kitSearch.toLowerCase())
                  )
                  .map((kit) => (
                    <div
                      key={kit.id}
                      className={`px-3 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 ${
                        form.kitId === kit.id ? 'bg-gray-100 dark:bg-gray-800' : ''
                      }`}
                      onClick={() => setForm({ ...form, kitId: kit.id })}
                    >
                      {kit.imageUrl && (
                        <img src={getImageUrl(kit.imageUrl)} alt={kit.name} className="w-8 h-8 rounded object-cover" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium">{kit.name} - {kit.team}</div>
                        <Badge className={getKitTypeColor(kit.type)} size="sm">
                          {translateKitType(kit.type)}
                        </Badge>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annulla
            </Button>
            <Button onClick={handleSubmit}>
              {editingAssociation ? 'Aggiorna' : 'Crea Associazione'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
