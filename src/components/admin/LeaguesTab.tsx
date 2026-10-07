'use client';

import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { League, Nation } from './types';
import Flag from 'react-world-flags';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';

interface LeaguesTabProps {
  adminToken: string;
}

interface LeagueForm {
  season: string;
  name: string;
  nation: string; // nome della nazione, preso dalla tabella Nation
  // Logo in base64 (solo se è stato scelto un nuovo file)
  logoData: string | null;
  logoMimeType: string | null;
  removeLogo: boolean;
}

const EMPTY_FORM: LeagueForm = {
  season: '',
  name: '',
  nation: '',
  logoData: null,
  logoMimeType: null,
  removeLogo: false,
};

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

// Helper per convertire File in base64 (senza prefisso "data:mime;base64,")
const fileToBase64 = (file: File): Promise<{ data: string; mimeType: string }> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve({ data: result.split(',')[1], mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

// URL del logo; "t" cambia a ogni modifica per evitare la cache del browser
const getLeagueLogoUrl = (league: League) =>
  `/api/leagues/${league.id}/logo?t=${new Date(league.updatedAt ?? 0).getTime()}`;

export default function LeaguesTab({ adminToken }: LeaguesTabProps) {
  const { toast } = useToast();
  const [leagues, setLeagues] = useState<League[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLeague, setEditingLeague] = useState<League | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<LeagueForm>(EMPTY_FORM);
  const [nationSearch, setNationSearch] = useState('');

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  // Carica campionati e nazionalità (le nazioni sono sempre lette dalla tabella dedicata)
  const fetchData = useCallback(async () => {
    try {
      const [leaguesRes, nationsRes] = await Promise.all([
        fetch('/api/leagues'),
        fetch('/api/nations'),
      ]);
      if (!leaguesRes.ok || !nationsRes.ok) throw new Error('Fetch failed');
      setLeagues(await leaguesRes.json());
      setNations(await nationsRes.json());
    } catch (error) {
      console.error('Error loading leagues:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i campionati',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const findNation = (name: string) => nations.find((n) => n.name === name);

  const filteredLeagues = leagues.filter((league) => {
    const term = search.toLowerCase();
    return (
      !term ||
      league.season.toLowerCase().includes(term) ||
      league.name.toLowerCase().includes(term) ||
      league.nation.toLowerCase().includes(term)
    );
  });

  const handleOpenNewDialog = () => {
    setEditingLeague(null);
    setForm(EMPTY_FORM);
    setNationSearch('');
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (league: League) => {
    setEditingLeague(league);
    setForm({ ...EMPTY_FORM, season: league.season, name: league.name, nation: league.nation });
    setNationSearch('');
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingLeague(null);
    setForm(EMPTY_FORM);
    setNationSearch('');
    setDialogOpen(false);
  };

  const errorMessage = async (response: Response, fallback: string) => {
    try {
      const data = await response.json();
      return data.error || fallback;
    } catch {
      return fallback;
    }
  };

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Errore', description: 'Seleziona un file immagine', variant: 'destructive' });
      e.target.value = '';
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast({
        title: 'Errore',
        description: 'Il logo è troppo grande (massimo 2 MB)',
        variant: 'destructive',
      });
      e.target.value = '';
      return;
    }

    try {
      const { data, mimeType } = await fileToBase64(file);
      setForm((prev) => ({ ...prev, logoData: data, logoMimeType: mimeType, removeLogo: false }));
    } catch (error) {
      console.error('File reading failed:', error);
      toast({ title: 'Errore', description: 'Impossibile leggere il file', variant: 'destructive' });
    }
  };

  const handleSubmit = async () => {
    if (!form.season.trim() || !form.name.trim() || !form.nation) {
      toast({
        title: 'Errore',
        description: 'Stagione, campionato e nazione sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        editingLeague ? `/api/leagues/${editingLeague.id}` : '/api/leagues',
        {
          method: editingLeague ? 'PUT' : 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            season: form.season,
            name: form.name,
            nation: form.nation,
            // Il logo viene inviato solo se nuovo o da rimuovere: altrimenti resta invariato
            ...(form.logoData ? { logoData: form.logoData, logoMimeType: form.logoMimeType } : {}),
            ...(form.removeLogo && !form.logoData ? { removeLogo: true } : {}),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await errorMessage(response, 'Impossibile salvare il campionato'));
      }

      toast({
        title: 'Successo',
        description: editingLeague ? 'Campionato aggiornato' : 'Campionato creato',
      });
      handleCloseDialog();
      await fetchData();
    } catch (error) {
      console.error('Error saving league:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile salvare il campionato',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (league: League) => {
    try {
      const response = await fetch(`/api/leagues/${league.id}`, {
        method: 'DELETE',
        headers: authHeaders,
      });

      if (!response.ok) {
        throw new Error(await errorMessage(response, 'Impossibile eliminare il campionato'));
      }

      toast({ title: 'Successo', description: 'Campionato eliminato' });
      setLeagues((prev) => prev.filter((l) => l.id !== league.id));
    } catch (error) {
      console.error('Error deleting league:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile eliminare il campionato',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full w-full flex flex-col gap-3 overflow-hidden">
      {/* Header e ricerca */}
      <div className="shrink-0 space-y-2">
        <div className="flex justify-between items-center gap-2 w-full">
          <h3 className="text-sm font-semibold truncate">Lista Campionati</h3>
          <Button onClick={handleOpenNewDialog} size="sm" className="shrink-0 text-xs px-3 h-8">
            <Plus className="w-3.5 h-3.5 mr-1" />
            Nuovo
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Cerca per stagione, campionato o nazione..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 text-sm pl-10 pr-3"
          />
        </div>
      </div>

      {/* Tabella campionati */}
      <Card className="flex-1 min-h-0 overflow-hidden">
        <CardContent className="p-0 h-full overflow-auto">
          <Table className="min-w-[500px]">
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead className="text-xs">Logo</TableHead>
                <TableHead className="text-xs">Stagione</TableHead>
                <TableHead className="text-xs">Campionato</TableHead>
                <TableHead className="text-xs">Nazione</TableHead>
                <TableHead className="text-xs text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeagues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                    {search ? 'Nessun risultato trovato' : 'Nessun campionato presente'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeagues.map((league) => {
                  const nation = findNation(league.nation);
                  return (
                    <TableRow key={league.id}>
                      <TableCell>
                        {league.hasLogo ? (
                          <img
                            src={getLeagueLogoUrl(league)}
                            alt={league.name}
                            className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-contain ring-1 ring-border/50"
                          />
                        ) : (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{league.season}</TableCell>
                      <TableCell>{league.name}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {nation && (
                            <Flag
                              code={convertAlpha3ToAlpha2(nation.code)}
                              className="w-4 h-3 object-cover"
                            />
                          )}
                          {league.nation}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(league)}
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
                                  Stai per eliminare il campionato &quot;{league.name}&quot; ({league.season}).
                                  I kit associati resteranno senza campionato.
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(league)}>
                                  Elimina
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog crea / modifica */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="w-[95vw] max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {editingLeague ? 'Modifica Campionato' : 'Nuovo Campionato'}
            </DialogTitle>
            <DialogDescription>
              {editingLeague ? 'Modifica i dettagli del campionato' : 'Aggiungi un nuovo campionato'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Stagione */}
            <div className="space-y-1.5">
              <Label htmlFor="league-season">Stagione *</Label>
              <Input
                id="league-season"
                value={form.season}
                onChange={(e) => setForm({ ...form, season: e.target.value })}
                placeholder="Es: 2025/26"
                maxLength={50}
              />
            </div>
            {/* Campionato */}
            <div className="space-y-1.5">
              <Label htmlFor="league-name">Campionato *</Label>
              <Input
                id="league-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Es: Serie A"
                maxLength={100}
              />
            </div>
            {/* Logo */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="league-logo">Logo Campionato</Label>
              <Input
                key={`logo-${editingLeague?.id || 'new'}`}
                id="league-logo"
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
              <div className="flex items-center gap-3 mt-1">
                {form.logoData ? (
                  <>
                    <img
                      src={`data:${form.logoMimeType};base64,${form.logoData}`}
                      alt="Anteprima"
                      className="w-10 h-10 rounded object-contain border"
                    />
                    <span className="text-xs text-muted-foreground">Nuovo file</span>
                  </>
                ) : editingLeague?.hasLogo && !form.removeLogo ? (
                  <>
                    <img
                      src={getLeagueLogoUrl(editingLeague)}
                      alt="Logo attuale"
                      className="w-10 h-10 rounded object-contain border"
                    />
                    <span className="text-xs text-muted-foreground">File presente</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-red-500"
                      onClick={() => setForm({ ...form, removeLogo: true })}
                    >
                      Rimuovi logo
                    </Button>
                  </>
                ) : form.removeLogo ? (
                  <span className="text-xs text-muted-foreground">
                    Il logo verrà rimosso al salvataggio
                  </span>
                ) : null}
              </div>
            </div>
            {/* Nazione - scelta tra le nazionalità esistenti */}
            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="league-nation">
                {form.nation ? `Nazione: ${form.nation}` : 'Nazione *'}
              </Label>
              {nations.length === 0 ? (
                <p className="text-sm text-muted-foreground border rounded-md px-3 py-2">
                  Nessuna nazionalità presente: popolale prima dalla sezione Nazionalità.
                </p>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="league-nation"
                      placeholder="Cerca nazionalità..."
                      value={nationSearch}
                      onChange={(e) => setNationSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-40 overflow-y-auto border rounded-md text-sm">
                    {nations
                      .filter((n) => n.name.toLowerCase().includes(nationSearch.toLowerCase()))
                      .map((nation) => (
                        <div
                          key={nation.id}
                          className={`px-3 py-1 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
                            form.nation === nation.name ? 'bg-gray-100 dark:bg-gray-800' : ''
                          }`}
                          onClick={() => setForm({ ...form, nation: nation.name })}
                        >
                          <span className="flex items-center gap-2">
                            <Flag
                              code={convertAlpha3ToAlpha2(nation.code)}
                              className="w-4 h-3 object-cover"
                            />
                            {nation.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </>
              )}
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
              ) : editingLeague ? (
                'Aggiorna'
              ) : (
                'Crea'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
