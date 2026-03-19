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
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Trash2, Search, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Kit, ContentStatus, CONTENT_STATUS_LABELS } from './types';
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
  status: ContentStatus;
  // Dati immagine in base64
  imageData: string | null;
  imageMimeType: string | null;
  logoData: string | null;
  logoMimeType: string | null;
  model3DData: string | null;
  model3DName: string | null;
  // Detail images
  detail1Data: string | null;
  detail1MimeType: string | null;
  detail2Data: string | null;
  detail2MimeType: string | null;
  detail3Data: string | null;
  detail3MimeType: string | null;
  detail4Data: string | null;
  detail4MimeType: string | null;
  detail5Data: string | null;
  detail5MimeType: string | null;
  detail6Data: string | null;
  detail6MimeType: string | null;
  // Detail labels
  detail1Label: string;
  detail2Label: string;
  detail3Label: string;
  detail4Label: string;
  detail5Label: string;
  detail6Label: string;
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
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('');
  const [form, setForm] = useState<KitForm>({
    name: '',
    team: '',
    type: 'goalkeeper',
    status: 'NON_IMPOSTATO',
    imageData: null,
    imageMimeType: null,
    logoData: null,
    logoMimeType: null,
    model3DData: null,
    model3DName: null,
    detail1Data: null,
    detail1MimeType: null,
    detail2Data: null,
    detail2MimeType: null,
    detail3Data: null,
    detail3MimeType: null,
    detail4Data: null,
    detail4MimeType: null,
    detail5Data: null,
    detail5MimeType: null,
    detail6Data: null,
    detail6MimeType: null,
    detail1Label: '',
    detail2Label: '',
    detail3Label: '',
    detail4Label: '',
    detail5Label: '',
    detail6Label: '',
  });

  const filteredKits = kits.filter(kit =>
    kit.name.toLowerCase().includes(search.season.toLowerCase()) &&
    kit.team.toLowerCase().includes(search.team.toLowerCase()) &&
    kit.type.toLowerCase().includes(search.type.toLowerCase())
  );

  const handleOpenNewDialog = () => {
    setEditingKit(null);
    setForm({
      name: '',
      team: '',
      type: 'goalkeeper',
      status: 'NON_IMPOSTATO',
      imageData: null,
      imageMimeType: null,
      logoData: null,
      logoMimeType: null,
      model3DData: null,
      model3DName: null,
      detail1Data: null,
      detail1MimeType: null,
      detail2Data: null,
      detail2MimeType: null,
      detail3Data: null,
      detail3MimeType: null,
      detail4Data: null,
      detail4MimeType: null,
      detail5Data: null,
      detail5MimeType: null,
      detail6Data: null,
      detail6MimeType: null,
      detail1Label: '',
      detail2Label: '',
      detail3Label: '',
      detail4Label: '',
      detail5Label: '',
      detail6Label: '',
    });
    setDialogOpen(true);
  };

  const handleOpenEditDialog = (kit: Kit) => {
    setEditingKit(kit);
    setForm({
      name: kit.name,
      team: kit.team,
      type: kit.type,
      status: kit.status || 'NON_IMPOSTATO',
      // Quando modifichi, non carichiamo i dati binari esistenti
      // L'utente può caricare un nuovo file se vuole sostituire
      imageData: null,
      imageMimeType: null,
      logoData: null,
      logoMimeType: null,
      model3DData: null,
      model3DName: null,
      detail1Data: null,
      detail1MimeType: null,
      detail2Data: null,
      detail2MimeType: null,
      detail3Data: null,
      detail3MimeType: null,
      detail4Data: null,
      detail4MimeType: null,
      detail5Data: null,
      detail5MimeType: null,
      detail6Data: null,
      detail6MimeType: null,
      detail1Label: kit.detail1Label || '',
      detail2Label: kit.detail2Label || '',
      detail3Label: kit.detail3Label || '',
      detail4Label: kit.detail4Label || '',
      detail5Label: kit.detail5Label || '',
      detail6Label: kit.detail6Label || '',
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setEditingKit(null);
    setForm({
      name: '',
      team: '',
      type: 'goalkeeper',
      status: 'NON_IMPOSTATO',
      imageData: null,
      imageMimeType: null,
      logoData: null,
      logoMimeType: null,
      model3DData: null,
      model3DName: null,
      detail1Data: null,
      detail1MimeType: null,
      detail2Data: null,
      detail2MimeType: null,
      detail3Data: null,
      detail3MimeType: null,
      detail4Data: null,
      detail4MimeType: null,
      detail5Data: null,
      detail5MimeType: null,
      detail6Data: null,
      detail6MimeType: null,
      detail1Label: '',
      detail2Label: '',
      detail3Label: '',
      detail4Label: '',
      detail5Label: '',
      detail6Label: '',
    });
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

    setSaving(true);
    setUploadProgress(0);
    setUploadStatus('Preparazione dati...');
    
    // Conta i file da caricare per simulare l'avanzamento
    const filesToUpload = [
      form.imageData,
      form.logoData,
      form.model3DData,
      form.detail1Data,
      form.detail2Data,
      form.detail3Data,
      form.detail4Data,
      form.detail5Data,
      form.detail6Data,
    ].filter(Boolean).length;
    
    // Simula avanzamento iniziale
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);
    
    try {
      if (editingKit) {
        setUploadStatus('Aggiornamento kit in corso...');
        
        // Quando modifichi, includi solo i campi binary che hanno nuovi valori
        // per NON sovrascrivere i dati esistenti
        const updateData: any = {
          name: form.name,
          team: form.team,
          type: form.type,
          status: form.status,
          detail1Label: form.detail1Label || null,
          detail2Label: form.detail2Label || null,
          detail3Label: form.detail3Label || null,
          detail4Label: form.detail4Label || null,
          detail5Label: form.detail5Label || null,
          detail6Label: form.detail6Label || null,
        };
        
        // Aggiungi solo i file che sono stati caricati (non null)
        if (form.imageData) {
          updateData.imageData = form.imageData;
          updateData.imageMimeType = form.imageMimeType;
        }
        if (form.logoData) {
          updateData.logoData = form.logoData;
          updateData.logoMimeType = form.logoMimeType;
        }
        if (form.model3DData) {
          updateData.model3DData = form.model3DData;
          updateData.model3DName = form.model3DName;
        }
        if (form.detail1Data) {
          updateData.detail1Data = form.detail1Data;
          updateData.detail1MimeType = form.detail1MimeType;
        }
        if (form.detail2Data) {
          updateData.detail2Data = form.detail2Data;
          updateData.detail2MimeType = form.detail2MimeType;
        }
        if (form.detail3Data) {
          updateData.detail3Data = form.detail3Data;
          updateData.detail3MimeType = form.detail3MimeType;
        }
        if (form.detail4Data) {
          updateData.detail4Data = form.detail4Data;
          updateData.detail4MimeType = form.detail4MimeType;
        }
        if (form.detail5Data) {
          updateData.detail5Data = form.detail5Data;
          updateData.detail5MimeType = form.detail5MimeType;
        }
        if (form.detail6Data) {
          updateData.detail6Data = form.detail6Data;
          updateData.detail6MimeType = form.detail6MimeType;
        }
        
        await onUpdateKit(editingKit.id, updateData);
      } else {
        setUploadStatus(`Creazione kit (${filesToUpload} file da salvare)...`);
        
        // Per nuovo kit, invia solo i campi necessari
        const createData: any = {
          name: form.name,
          team: form.team,
          type: form.type,
          status: form.status,
        };
        
        // Aggiungi file solo se presenti
        if (form.imageData) {
          createData.imageData = form.imageData;
          createData.imageMimeType = form.imageMimeType;
        }
        if (form.logoData) {
          createData.logoData = form.logoData;
          createData.logoMimeType = form.logoMimeType;
        }
        if (form.model3DData) {
          createData.model3DData = form.model3DData;
          createData.model3DName = form.model3DName;
        }
        if (form.detail1Data) {
          createData.detail1Data = form.detail1Data;
          createData.detail1MimeType = form.detail1MimeType;
          createData.detail1Label = form.detail1Label || null;
        }
        if (form.detail2Data) {
          createData.detail2Data = form.detail2Data;
          createData.detail2MimeType = form.detail2MimeType;
          createData.detail2Label = form.detail2Label || null;
        }
        if (form.detail3Data) {
          createData.detail3Data = form.detail3Data;
          createData.detail3MimeType = form.detail3MimeType;
          createData.detail3Label = form.detail3Label || null;
        }
        if (form.detail4Data) {
          createData.detail4Data = form.detail4Data;
          createData.detail4MimeType = form.detail4MimeType;
          createData.detail4Label = form.detail4Label || null;
        }
        if (form.detail5Data) {
          createData.detail5Data = form.detail5Data;
          createData.detail5MimeType = form.detail5MimeType;
          createData.detail5Label = form.detail5Label || null;
        }
        if (form.detail6Data) {
          createData.detail6Data = form.detail6Data;
          createData.detail6MimeType = form.detail6MimeType;
          createData.detail6Label = form.detail6Label || null;
        }
        
        await onCreateKit(createData);
      }
      
      setUploadProgress(100);
      setUploadStatus('Completato!');
      
      setTimeout(() => {
        handleCloseDialog();
      }, 500);
    } catch (error: any) {
      console.error('Error saving kit:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile salvare il kit',
        variant: 'destructive',
      });
    } finally {
      clearInterval(progressInterval);
      setSaving(false);
      setUploadProgress(0);
      setUploadStatus('');
    }
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'imageData' | 'logoData' | 'model3DData' | 'detail1Data' | 'detail2Data' | 'detail3Data' | 'detail4Data' | 'detail5Data' | 'detail6Data'
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const { data, mimeType } = await fileToBase64(file);
        
        setForm(prev => {
          if (field === 'model3DData') {
            return { 
              ...prev, 
              model3DData: data, 
              model3DName: file.name 
            };
          } else if (field === 'imageData') {
            return { ...prev, imageData: data, imageMimeType: mimeType };
          } else if (field === 'logoData') {
            return { ...prev, logoData: data, logoMimeType: mimeType };
          } else {
            // Per i dettagli, impostiamo sia data che mimeType
            const mimeTypeField = field.replace('Data', 'MimeType') as keyof KitForm;
            return { 
              ...prev, 
              [field]: data, 
              [mimeTypeField]: mimeType 
            };
          }
        });
      } catch (error) {
        console.error('File reading failed:', error);
      }
    }
  };

  // Helper per ottenere l'URL dell'immagine con cache buster
  const getImagePreviewUrl = (kitId: string, type: 'image' | 'logo' | 'model3d' | 'detail', detailNum?: number, updatedAt?: string | Date) => {
    const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
    if (type === 'detail' && detailNum) {
      return `/api/kits/${kitId}/detail/${detailNum}${cacheBuster}`;
    }
    return `/api/kits/${kitId}/${type}${cacheBuster}`;
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
                  <TableHead>Stato</TableHead>
                  <TableHead>Immagine</TableHead>
                  <TableHead>Logo</TableHead>
                  <TableHead>Modello 3D</TableHead>
                  <TableHead className="text-right">Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKits.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-gray-500 py-8">
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
                        {kit.status && kit.status !== 'NON_IMPOSTATO' ? (
                          <Badge className={kit.status === 'NUOVO' ? 'bg-green-500 text-white' : 'bg-amber-500 text-white'}>
                            {CONTENT_STATUS_LABELS[kit.status]}
                          </Badge>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kit.hasImage ? (
                          <img src={getImagePreviewUrl(kit.id, 'image', undefined, kit.updatedAt)} alt={kit.name} className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kit.hasLogo ? (
                          <img src={getImagePreviewUrl(kit.id, 'logo', undefined, kit.updatedAt)} alt="Logo" className="w-10 h-10 rounded object-contain bg-white p-1" />
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {kit.hasModel3D ? (
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
        <DialogContent className="max-w-2xl sm:max-w-4xl lg:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-3 sm:pb-4">
            <DialogTitle className="text-lg sm:text-xl">
              {editingKit ? 'Modifica Kit' : 'Nuovo Kit'}
            </DialogTitle>
            <DialogDescription>
              {editingKit ? 'Modifica i dettagli del kit' : 'Aggiungi un nuovo kit'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Dati principali */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            </div>
            
            {/* Status Select */}
            <div className="space-y-2 max-w-xs">
              <Label htmlFor="kit-status">Stato</Label>
              <Select 
                value={form.status} 
                onValueChange={(value: ContentStatus) => setForm({ ...form, status: value })}
              >
                <SelectTrigger id="kit-status">
                  <SelectValue placeholder="Seleziona stato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NON_IMPOSTATO">Non Impostato</SelectItem>
                  <SelectItem value="NUOVO">Nuovo</SelectItem>
                  <SelectItem value="AGGIORNATO">Aggiornato</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                I kit con stato "Nuovo" o "Aggiornato" verranno mostrati in cima alla lista.
              </p>
            </div>
            
            {/* File upload - 3 colonne */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Immagine Kit */}
              <div className="space-y-2">
                <Label>Immagine Kit</Label>
                <Input
                  key={`image-${editingKit?.id || 'new'}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'imageData')}
                  disabled={uploading}
                />
                {form.imageData ? (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={`data:${form.imageMimeType};base64,${form.imageData}`} alt="Kit" className="w-10 h-10 rounded object-cover border" />
                    <span className="text-xs text-muted-foreground">Nuovo file</span>
                  </div>
                ) : editingKit?.hasImage ? (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={getImagePreviewUrl(editingKit.id, 'image', undefined, editingKit.updatedAt)} alt="Kit" className="w-10 h-10 rounded object-cover border" />
                    <span className="text-xs text-muted-foreground">File presente - carica un nuovo file per sostituirlo</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nessun file selezionato</p>
                )}
              </div>
              
              {/* Logo */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <Input
                  key={`logo-${editingKit?.id || 'new'}`}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'logoData')}
                  disabled={uploading}
                />
                {form.logoData ? (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={`data:${form.logoMimeType};base64,${form.logoData}`} alt="Logo" className="w-10 h-10 rounded object-contain border bg-white p-1" />
                    <span className="text-xs text-muted-foreground">Nuovo file</span>
                  </div>
                ) : editingKit?.hasLogo ? (
                  <div className="flex items-center gap-2 mt-1">
                    <img src={getImagePreviewUrl(editingKit.id, 'logo', undefined, editingKit.updatedAt)} alt="Logo" className="w-10 h-10 rounded object-contain border bg-white p-1" />
                    <span className="text-xs text-muted-foreground">File presente</span>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nessun file selezionato</p>
                )}
              </div>
              
              {/* Modello 3D */}
              <div className="space-y-2">
                <Label>Modello 3D</Label>
                <Input
                  key={`model3d-${editingKit?.id || 'new'}`}
                  type="file"
                  accept=".glb,.gltf"
                  onChange={(e) => handleFileUpload(e, 'model3DData')}
                  disabled={uploading}
                />
                {form.model3DData ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">Nuovo: {form.model3DName}</Badge>
                  </div>
                ) : editingKit?.hasModel3D ? (
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">3D presente</Badge>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Nessun file selezionato</p>
                )}
              </div>
            </div>
            
            {/* Detail Images Section */}
            <div className="border-t pt-4 mt-4">
              <h4 className="text-sm font-semibold mb-3">Immagini Dettagli</h4>
              <p className="text-xs text-muted-foreground mb-4">
                Carica le immagini dei dettagli del kit (colletto, logo, guanti, calzini, ecc.)
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Detail 1 */}
                <div className="space-y-2">
                  <Label className="text-xs">Dettaglio 1 (Sinistra alto)</Label>
                  <Input
                    type="text"
                    placeholder="Es: Colletto"
                    value={form.detail1Label}
                    onChange={(e) => setForm({ ...form, detail1Label: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    key={`detail1-${editingKit?.id || 'new'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'detail1Data')}
                    disabled={uploading}
                    className="h-8 text-xs"
                  />
                  {form.detail1Data ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={`data:${form.detail1MimeType};base64,${form.detail1Data}`} alt="Detail 1" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">Nuovo</span>
                    </div>
                  ) : editingKit?.hasDetail1 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={getImagePreviewUrl(editingKit.id, 'detail', 1, editingKit.updatedAt)} alt="Detail 1" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">File presente</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Detail 2 */}
                <div className="space-y-2">
                  <Label className="text-xs">Dettaglio 2 (Sinistra centro)</Label>
                  <Input
                    type="text"
                    placeholder="Es: Logo squadra"
                    value={form.detail2Label}
                    onChange={(e) => setForm({ ...form, detail2Label: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    key={`detail2-${editingKit?.id || 'new'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'detail2Data')}
                    disabled={uploading}
                    className="h-8 text-xs"
                  />
                  {form.detail2Data ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={`data:${form.detail2MimeType};base64,${form.detail2Data}`} alt="Detail 2" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">Nuovo</span>
                    </div>
                  ) : editingKit?.hasDetail2 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={getImagePreviewUrl(editingKit.id, 'detail', 2, editingKit.updatedAt)} alt="Detail 2" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">File presente</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Detail 3 */}
                <div className="space-y-2">
                  <Label className="text-xs">Dettaglio 3 (Sinistra basso)</Label>
                  <Input
                    type="text"
                    placeholder="Es: Maniche"
                    value={form.detail3Label}
                    onChange={(e) => setForm({ ...form, detail3Label: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    key={`detail3-${editingKit?.id || 'new'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'detail3Data')}
                    disabled={uploading}
                    className="h-8 text-xs"
                  />
                  {form.detail3Data ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={`data:${form.detail3MimeType};base64,${form.detail3Data}`} alt="Detail 3" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">Nuovo</span>
                    </div>
                  ) : editingKit?.hasDetail3 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={getImagePreviewUrl(editingKit.id, 'detail', 3, editingKit.updatedAt)} alt="Detail 3" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">File presente</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Detail 4 */}
                <div className="space-y-2">
                  <Label className="text-xs">Dettaglio 4 (Destra alto)</Label>
                  <Input
                    type="text"
                    placeholder="Es: Guanti"
                    value={form.detail4Label}
                    onChange={(e) => setForm({ ...form, detail4Label: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    key={`detail4-${editingKit?.id || 'new'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'detail4Data')}
                    disabled={uploading}
                    className="h-8 text-xs"
                  />
                  {form.detail4Data ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={`data:${form.detail4MimeType};base64,${form.detail4Data}`} alt="Detail 4" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">Nuovo</span>
                    </div>
                  ) : editingKit?.hasDetail4 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={getImagePreviewUrl(editingKit.id, 'detail', 4, editingKit.updatedAt)} alt="Detail 4" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">File presente</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Detail 5 */}
                <div className="space-y-2">
                  <Label className="text-xs">Dettaglio 5 (Destra centro)</Label>
                  <Input
                    type="text"
                    placeholder="Es: Calzini"
                    value={form.detail5Label}
                    onChange={(e) => setForm({ ...form, detail5Label: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    key={`detail5-${editingKit?.id || 'new'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'detail5Data')}
                    disabled={uploading}
                    className="h-8 text-xs"
                  />
                  {form.detail5Data ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={`data:${form.detail5MimeType};base64,${form.detail5Data}`} alt="Detail 5" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">Nuovo</span>
                    </div>
                  ) : editingKit?.hasDetail5 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={getImagePreviewUrl(editingKit.id, 'detail', 5, editingKit.updatedAt)} alt="Detail 5" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">File presente</span>
                    </div>
                  ) : null}
                </div>
                
                {/* Detail 6 */}
                <div className="space-y-2">
                  <Label className="text-xs">Dettaglio 6 (Destra basso)</Label>
                  <Input
                    type="text"
                    placeholder="Es: Pantaloncini"
                    value={form.detail6Label}
                    onChange={(e) => setForm({ ...form, detail6Label: e.target.value })}
                    className="h-8 text-xs"
                  />
                  <Input
                    key={`detail6-${editingKit?.id || 'new'}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e, 'detail6Data')}
                    disabled={uploading}
                    className="h-8 text-xs"
                  />
                  {form.detail6Data ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={`data:${form.detail6MimeType};base64,${form.detail6Data}`} alt="Detail 6" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">Nuovo</span>
                    </div>
                  ) : editingKit?.hasDetail6 ? (
                    <div className="flex items-center gap-2 mt-1">
                      <img src={getImagePreviewUrl(editingKit.id, 'detail', 6, editingKit.updatedAt)} alt="Detail 6" className="w-8 h-8 rounded object-cover border" />
                      <span className="text-xs text-muted-foreground">File presente</span>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-3">
            {/* Progress bar during save */}
            {saving && (
              <div className="w-full sm:flex-1 space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{uploadStatus}</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
            <div className="flex gap-2">
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
                  editingKit ? 'Aggiorna' : 'Crea'
                )}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
