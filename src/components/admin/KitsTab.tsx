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
import { Plus, Pencil, Trash2, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Kit } from './types';
import { translateKitType, getKitTypeColor } from './utils';

interface KitsTabProps {
  kits: Kit[];
  uploading: boolean;
  onUpload: (file: File, folder: string) => Promise<string>;
  onCreateKit: (kitData: any) => Promise<void>;
  onUpdateKit: (kitId: string, kitData: any) => Promise<void>;
  onDeleteKit: (kitId: string) => void;
}

interface KitForm {
  name: string;
  team: string;
  type: string;
  imageUrl: string;
  model3DUrl: string;
  logoUrl: string;
}

export default function KitsTab({
  kits,
  uploading,
  onUpload,
  onCreateKit,
  onUpdateKit,
  onDeleteKit,
}: KitsTabProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState({ season: '', team: '', type: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingKit, setEditingKit] = useState<Kit | null>(null);
  const [form, setForm] = useState<KitForm>({
    name: '',
    team: '',
    type: 'home',
    imageUrl: '',
    model3DUrl: '',
    logoUrl: '',
  });

  const filteredKits = kits.filter(kit =>
    kit.name.toLowerCase().includes(search.season.toLowerCase()) &&
    kit.team.toLowerCase().includes(search.team.toLowerCase()) &&
    kit.type.toLowerCase().includes(search.type.toLowerCase())
  );

  const handleOpenNewDialog = () => {
    setEditingKit(null);
    setForm({ name: '', team: '', type: 'home', imageUrl: '', model3DUrl: '', logoUrl: '' });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (kit: Kit) => {
    setEditingKit(kit);
    setForm({
      name: kit.name,
      team: kit.team,
      type: kit.type,
      imageUrl: kit.imageUrl || '',
      model3DUrl: kit.model3DUrl || '',
      logoUrl: kit.logoUrl || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingKit(null);
    setForm({ name: '', team: '', type: 'home', imageUrl: '', model3DUrl: '', logoUrl: '' });
    setDialogOpen(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.team || !form.type) {
      toast({
        title: 'Errore',
        description: 'Stagione, squadra/nazionale e tipo sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (editingKit) {
        await onUpdateKit(editingKit.id, form);
      } else {
        await onCreateKit(form);
      }
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving kit:', error);
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageUrl' | 'logoUrl' | 'model3DUrl',
    folder: string
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await onUpload(file, folder);
        setForm({ ...form, [field]: url });
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
          <h3 className="text-lg font-semibold">Lista Kit</h3>
          <div className="flex gap-2 flex-wrap">
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
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca tipo..."
                value={search.type}
                onChange={(e) => setSearch({ ...search, type: e.target.value })}
                className="pl-10 w-40"
              />
            </div>
          </div>
        </div>
        <Button onClick={handleOpenNewDialog}>
          <Plus className="w-4 h-4 mr-2" />
          Aggiungi Kit
        </Button>
      </div>

      {/* Kits Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Stagione</TableHead>
                  <TableHead>Squadra/Nazionale</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Immagine</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Modello 3D</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                      {(search.season || search.team || search.type) ? 'Nessun risultato trovato' : 'Nessun kit presente'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKits.map((kit) => (
                    <TableRow key={kit.id}>
                      <TableCell className="font-medium">{kit.name}</TableCell>
                      <TableCell>{kit.team}</TableCell>
                      <TableCell>
                        <Badge className={getKitTypeColor(kit.type)}>
                          {translateKitType(kit.type)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {kit.imageUrl ? (
                          <img src={getImageUrl(kit.imageUrl)} alt={kit.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kit.logoUrl ? (
                          <img src={getImageUrl(kit.logoUrl)} alt="Logo" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kit.model3DUrl ? (
                          <Badge variant="outline">Presente</Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEditDialog(kit)}
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
                                  Questa azione eliminerà il kit e tutte le sue associazioni con i giocatori.
                                  Questa azione non può essere annullata.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction onClick={() => onDeleteKit(kit.id)}>
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

      {/* Kit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-md sm:max-w-2xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {editingKit ? 'Modifica Kit' : 'Nuovo Kit'}
            </DialogTitle>
            <DialogDescription>
              {editingKit ? 'Modifica i dettagli del kit' : 'Aggiungi un nuovo kit'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Stagione *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="2024/2025"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team">Squadra/Nazionale *</Label>
                <Input
                  id="team"
                  value={form.team}
                  onChange={(e) => setForm({ ...form, team: e.target.value })}
                  placeholder="Juventus"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={form.type} onValueChange={(value) => setForm({ ...form, type: value })}>
                <SelectTrigger id="type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Casa</SelectItem>
                  <SelectItem value="away">Trasferta</SelectItem>
                  <SelectItem value="third">Terza</SelectItem>
                  <SelectItem value="goalkeeper">Portiere</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 hidden">
              <Label htmlFor="imageUrl">URL Immagine Kit</Label>
              <Input
                id="imageUrl"
                value={form.imageUrl}
                onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
                placeholder="/path/to/kit.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Carica immagine kit</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'imageUrl', 'kits')}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
            <div className="space-y-2 hidden">
              <Label htmlFor="logoUrl">URL Logo</Label>
              <Input
                id="logoUrl"
                value={form.logoUrl}
                onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                placeholder="/path/to/logo.png"
              />
            </div>
            <div className="space-y-2">
              <Label>Carica logo</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logoUrl', 'kits')}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
            <div className="space-y-2 hidden">
              <Label htmlFor="model3DUrl">URL Modello 3D</Label>
              <Input
                id="model3DUrl"
                value={form.model3DUrl}
                onChange={(e) => setForm({ ...form, model3DUrl: e.target.value })}
                placeholder="/path/to/model.glb"
              />
            </div>
            <div className="space-y-2">
              <Label>Carica modello 3D</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept=".glb,.gltf"
                  onChange={(e) => handleFileUpload(e, 'model3DUrl', 'models')}
                  disabled={uploading}
                />
                {uploading && (
                  <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                )}
              </div>
            </div>
            {(form.imageUrl || form.logoUrl) && (
              <div className="flex gap-4 mt-4">
                {form.imageUrl && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Anteprima Kit:</p>
                    <img
                      src={getImageUrl(form.imageUrl)}
                      alt="Kit Preview"
                      className="w-32 h-32 object-cover rounded-lg"
                    />
                  </div>
                )}
                {form.logoUrl && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Anteprima Logo:</p>
                    <img
                      src={getImageUrl(form.logoUrl)}
                      alt="Logo Preview"
                      className="w-32 h-32 object-contain rounded-lg bg-white dark:bg-gray-800 p-2"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              Annulla
            </Button>
            <Button onClick={handleSubmit}>
              {editingKit ? 'Aggiorna' : 'Crea'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
