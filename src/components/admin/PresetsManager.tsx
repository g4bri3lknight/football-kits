'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
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
} from '@/components/ui/alert-dialog';
import {
  Save,
  Download,
  Upload,
  Trash2,
  Play,
  Search,
  CheckSquare,
  Square,
  Loader2,
  X,
  Bookmark,
  CircleCheck,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// ============================================================================
// Types
// ============================================================================
interface PresetsManagerProps {
  adminToken: string;
  currentConfig: Record<string, any>;
  onLoadPreset: (config: Record<string, any>) => void;
  kits: Array<{ id: string; name: string; team: string; hasModel3D: boolean }>;
  /** Called when presets list changes, passes the list of presets */
  onPresetsChange?: (presets: Array<{ id: string; name: string; config: string }>) => void;
}

interface Preset {
  id: string;
  name: string;
  config: string; // JSON string
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Helpers
// ============================================================================
/** Normalizza una config rimuovendo campi metadata, restituisce JSON string per confronto */
function normalizeConfig(config: Record<string, any> | string): string {
  try {
    const parsed = typeof config === 'string' ? JSON.parse(config) : config;
    const { id, kitId, updatedAt, createdAt, ...values } = parsed;
    return JSON.stringify(values);
  } catch {
    return '';
  }
}

// ============================================================================
// PresetsManager
// ============================================================================
export default function PresetsManager({
  adminToken,
  currentConfig,
  onLoadPreset,
  kits,
  onPresetsChange,
}: PresetsManagerProps) {
  const { toast } = useToast();

  // Preset list state
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState(true);

  // Save preset state
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saving, setSaving] = useState(false);
  const saveInputRef = useRef<HTMLInputElement>(null);

  // Delete confirmation
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);

  // Bulk apply state
  const [presetToApply, setPresetToApply] = useState<Preset | null>(null);
  const [selectedKitIds, setSelectedKitIds] = useState<Set<string>>(new Set());
  const [kitSearch, setKitSearch] = useState('');
  const [applying, setApplying] = useState(false);
  // Kit configs map: { kitId: normalizedConfigString }
  const [kitConfigsMap, setKitConfigsMap] = useState<Record<string, string>>({});
  const [loadingKitConfigs, setLoadingKitConfigs] = useState(false);

  // Pre-computed preset fingerprints for matching
  const presetFingerprints = useMemo(() => {
    const map: Record<string, string> = {};
    for (const p of presets) {
      map[p.id] = normalizeConfig(p.config);
    }
    return map;
  }, [presets]);

  // ============================================================================
  // Fetch presets
  // ============================================================================
  const fetchPresets = useCallback(async () => {
    setLoadingPresets(true);
    try {
      const res = await fetch('/api/viewer3d-presets');
      if (!res.ok) throw new Error('Errore nel caricamento dei preset');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setPresets(list);
      onPresetsChange?.(list.map((p: Preset) => ({ id: p.id, name: p.name, config: p.config })));
    } catch (err: any) {
      console.error('Error fetching presets:', err);
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile caricare i preset',
        variant: 'destructive',
      });
      setPresets([]);
      onPresetsChange?.([]);
    } finally {
      setLoadingPresets(false);
    }
  }, [toast, onPresetsChange]);

  useEffect(() => {
    fetchPresets();
  }, [fetchPresets]);

  // Focus save input when shown
  useEffect(() => {
    if (showSaveInput && saveInputRef.current) {
      saveInputRef.current.focus();
    }
  }, [showSaveInput]);

  // ============================================================================
  // Fetch kit configs in bulk (for the bulk apply dialog)
  // ============================================================================
  const fetchKitConfigs = useCallback(async () => {
    setLoadingKitConfigs(true);
    try {
      const res = await fetch('/api/kits/viewer3d-configs');
      if (!res.ok) throw new Error();
      const data = await res.json();
      setKitConfigsMap(data);
    } catch {
      setKitConfigsMap({});
    } finally {
      setLoadingKitConfigs(false);
    }
  }, []);

  // ============================================================================
  // Check if a kit already has a specific preset applied
  // ============================================================================
  const isKitPresetApplied = useCallback(
    (kitId: string, presetId: string): boolean => {
      const kitFingerprint = kitConfigsMap[kitId];
      const presetFingerprint = presetFingerprints[presetId];
      if (!kitFingerprint || !presetFingerprint) return false;
      return kitFingerprint === presetFingerprint;
    },
    [kitConfigsMap, presetFingerprints]
  );

  // ============================================================================
  // Find matching preset name for a given config fingerprint
  // ============================================================================
  const findMatchingPresetName = useCallback(
    (fingerprint: string): string | null => {
      for (const p of presets) {
        if (presetFingerprints[p.id] === fingerprint) return p.name;
      }
      return null;
    },
    [presets, presetFingerprints]
  );

  // ============================================================================
  // Save preset
  // ============================================================================
  const handleSavePreset = useCallback(async () => {
    const trimmedName = saveName.trim();
    if (!trimmedName) {
      toast({ title: 'Attenzione', description: 'Inserisci un nome per il preset' });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/viewer3d-presets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminToken,
          name: trimmedName,
          config: currentConfig,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Errore nel salvataggio');

      toast({ title: 'Successo', description: `Preset "${trimmedName}" salvato` });
      setSaveName('');
      setShowSaveInput(false);
      fetchPresets();
    } catch (err: any) {
      console.error('Error saving preset:', err);
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile salvare il preset',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [adminToken, saveName, currentConfig, toast, fetchPresets]);

  // ============================================================================
  // Load preset
  // ============================================================================
  const handleLoadPreset = useCallback(
    (preset: Preset) => {
      try {
        const parsedConfig = JSON.parse(preset.config);
        const mergedConfig = {
          id: 'viewer3d-config',
          updatedAt: new Date().toISOString(),
          ...parsedConfig,
        };
        onLoadPreset(mergedConfig);
        toast({ title: 'Preset caricato', description: `"${preset.name}" applicato alla configurazione` });
      } catch {
        toast({
          title: 'Errore',
          description: 'Impossibile leggere la configurazione del preset',
          variant: 'destructive',
        });
      }
    },
    [onLoadPreset, toast]
  );

  // ============================================================================
  // Delete preset
  // ============================================================================
  const handleDeletePreset = useCallback(async () => {
    if (!presetToDelete) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/viewer3d-presets/${presetToDelete.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Errore nell\'eliminazione');

      toast({ title: 'Successo', description: `Preset "${presetToDelete.name}" eliminato` });
      setPresetToDelete(null);
      fetchPresets();
    } catch (err: any) {
      console.error('Error deleting preset:', err);
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile eliminare il preset',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  }, [adminToken, presetToDelete, toast, fetchPresets]);

  // ============================================================================
  // Export preset
  // ============================================================================
  const handleExportPreset = useCallback(
    (preset: Preset) => {
      const url = `/api/viewer3d-presets/${preset.id}/export?adminToken=${encodeURIComponent(adminToken)}`;
      window.open(url, '_blank');
    },
    [adminToken]
  );

  // ============================================================================
  // Import preset
  // ============================================================================
  const handleImportFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setImporting(true);
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        if (!parsed.name || !parsed.config) {
          throw new Error('Il file non contiene i campi "name" e "config" richiesti');
        }

        const res = await fetch('/api/viewer3d-presets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            adminToken,
            name: parsed.name,
            config: parsed.config,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || data.details || 'Errore nell\'importazione');

        toast({ title: 'Successo', description: `Preset "${parsed.name}" importato` });
        fetchPresets();
      } catch (err: any) {
        console.error('Error importing preset:', err);
        toast({
          title: 'Errore',
          description: err.message || 'Impossibile importare il preset',
          variant: 'destructive',
        });
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    },
    [adminToken, toast, fetchPresets]
  );

  // ============================================================================
  // Bulk apply - computed kits
  // ============================================================================
  const kits3D = useMemo(() => kits.filter((k) => k.hasModel3D), [kits]);

  const filteredApplyKits = useMemo(() => {
    if (!kitSearch.trim()) return kits3D;
    const q = kitSearch.toLowerCase();
    return kits3D.filter(
      (k) => k.name.toLowerCase().includes(q) || k.team.toLowerCase().includes(q)
    );
  }, [kits3D, kitSearch]);

  const allFilteredSelected = useMemo(() => {
    if (filteredApplyKits.length === 0) return false;
    return filteredApplyKits.every((k) => selectedKitIds.has(k.id));
  }, [filteredApplyKits, selectedKitIds]);

  const handleToggleAll = useCallback(() => {
    if (allFilteredSelected) {
      setSelectedKitIds((prev) => {
        const next = new Set(prev);
        filteredApplyKits.forEach((k) => next.delete(k.id));
        return next;
      });
    } else {
      setSelectedKitIds((prev) => {
        const next = new Set(prev);
        filteredApplyKits.forEach((k) => next.add(k.id));
        return next;
      });
    }
  }, [allFilteredSelected, filteredApplyKits]);

  const handleToggleKit = useCallback((kitId: string) => {
    setSelectedKitIds((prev) => {
      const next = new Set(prev);
      if (next.has(kitId)) {
        next.delete(kitId);
      } else {
        next.add(kitId);
      }
      return next;
    });
  }, []);

  // Open bulk apply dialog — fetch kit configs
  const handleOpenBulkApply = useCallback((preset: Preset) => {
    setPresetToApply(preset);
    setSelectedKitIds(new Set());
    setKitSearch('');
    fetchKitConfigs();
  }, [fetchKitConfigs]);

  // Execute bulk apply
  const handleBulkApply = useCallback(async () => {
    if (!presetToApply || selectedKitIds.size === 0) return;

    setApplying(true);
    try {
      const res = await fetch(`/api/viewer3d-presets/${presetToApply.id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          adminToken,
          kitIds: Array.from(selectedKitIds),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.details || 'Errore nell\'applicazione');

      const count = data.applied ?? selectedKitIds.size;
      toast({
        title: 'Successo',
        description: `Preset "${presetToApply.name}" applicato a ${count} kit`,
      });
      setPresetToApply(null);
      setSelectedKitIds(new Set());
      // Refresh kit configs to reflect the changes
      fetchKitConfigs();
    } catch (err: any) {
      console.error('Error applying preset:', err);
      toast({
        title: 'Errore',
        description: err.message || 'Impossibile applicare il preset',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  }, [adminToken, presetToApply, selectedKitIds, toast, fetchKitConfigs]);

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('it-IT', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Count kits with this preset already applied
  const countAlreadyApplied = useMemo(() => {
    if (!presetToApply) return 0;
    let count = 0;
    for (const kitId of Object.keys(kitConfigsMap)) {
      if (isKitPresetApplied(kitId, presetToApply.id)) count++;
    }
    return count;
  }, [presetToApply, kitConfigsMap, isKitPresetApplied]);

  // ============================================================================
  // Render
  // ============================================================================
  return (
    <div className="space-y-3">
      {/* Header actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="default"
          size="sm"
          className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setShowSaveInput(true)}
        >
          <Save className="w-3.5 h-3.5" />
          Salva come preset
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs gap-1.5"
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
        >
          {importing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Upload className="w-3.5 h-3.5" />
          )}
          Importa preset
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleImportFile}
        />
      </div>

      {/* Inline save input */}
      {showSaveInput && (
        <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg border">
          <Bookmark className="w-4 h-4 text-emerald-500 shrink-0" />
          <Input
            ref={saveInputRef}
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSavePreset();
              if (e.key === 'Escape') {
                setShowSaveInput(false);
                setSaveName('');
              }
            }}
            placeholder="Nome preset..."
            className="h-7 text-xs flex-1"
            disabled={saving}
          />
          <Button
            size="sm"
            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 px-3"
            onClick={handleSavePreset}
            disabled={saving || !saveName.trim()}
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Salva
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setShowSaveInput(false);
              setSaveName('');
            }}
            disabled={saving}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Preset list */}
      <div className="relative">
        {loadingPresets ? (
          <div className="flex items-center justify-center py-8 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="text-xs text-muted-foreground">Caricamento preset...</span>
          </div>
        ) : presets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bookmark className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">Nessun preset salvato</p>
          </div>
        ) : (
          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
            {presets.map((preset) => (
              <div
                key={preset.id}
                className="flex items-center gap-2 p-2 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group"
              >
                {/* Preset info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <Bookmark className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="text-xs font-medium truncate">{preset.name}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground ml-5">
                    {formatDate(preset.createdAt)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    title="Carica preset"
                    onClick={() => handleLoadPreset(preset)}
                  >
                    <Play className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10"
                    title="Applica a kit..."
                    onClick={() => handleOpenBulkApply(preset)}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                    title="Esporta JSON"
                    onClick={() => handleExportPreset(preset)}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                    title="Elimina preset"
                    onClick={() => setPresetToDelete(preset)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!presetToDelete} onOpenChange={(open) => !open && setPresetToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-sm">Elimina preset</AlertDialogTitle>
            <AlertDialogDescription className="text-xs">
              Sei sicuro di voler eliminare il preset &quot;{presetToDelete?.name}&quot;?
              Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-7 text-xs" disabled={deleting}>
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              className="h-7 text-xs bg-red-600 hover:bg-red-700"
              onClick={handleDeletePreset}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Elimina'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk apply dialog */}
      <Dialog open={!!presetToApply} onOpenChange={(open) => !open && setPresetToApply(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">
              Applica preset a kit
            </DialogTitle>
            <DialogDescription className="text-xs">
              Seleziona i kit a cui applicare il preset &quot;{presetToApply?.name}&quot;.
              {countAlreadyApplied > 0 && (
                <span className="text-emerald-600 font-medium">
                  {' '}({countAlreadyApplied} kit hanno già questa config)
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* Search kits */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Cerca kit..."
              value={kitSearch}
              onChange={(e) => setKitSearch(e.target.value)}
              className="h-7 pl-8 text-xs"
            />
          </div>

          {/* Select all toggle */}
          {filteredApplyKits.length > 0 && (
            <button
              type="button"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full"
              onClick={handleToggleAll}
            >
              {allFilteredSelected ? (
                <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Square className="w-3.5 h-3.5" />
              )}
              <span>
                {allFilteredSelected ? 'Deseleziona tutti' : 'Seleziona tutti'}
                <span className="ml-1 text-muted-foreground/70">
                  ({filteredApplyKits.length} kit)
                </span>
              </span>
            </button>
          )}

          {/* Kit list */}
          <ScrollArea className="max-h-80">
            <div className="space-y-0.5">
              {loadingKitConfigs ? (
                <div className="flex items-center justify-center py-6 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Caricamento stati...</span>
                </div>
              ) : filteredApplyKits.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {kitSearch ? 'Nessun kit trovato' : 'Nessun kit 3D disponibile'}
                </p>
              ) : (
                filteredApplyKits.map((kit) => {
                  const alreadyApplied = presetToApply ? isKitPresetApplied(kit.id, presetToApply.id) : false;
                  return (
                    <label
                      key={kit.id}
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 cursor-pointer transition-colors ${alreadyApplied ? 'bg-emerald-500/5' : ''}`}
                    >
                      <Checkbox
                        checked={selectedKitIds.has(kit.id)}
                        onCheckedChange={() => handleToggleKit(kit.id)}
                        className="size-3.5"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-xs truncate block">{kit.name}</span>
                        <span className="text-[10px] text-muted-foreground truncate block">
                          {kit.team}
                        </span>
                      </div>
                      {alreadyApplied && (
                        <CircleCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Configurazione già applicata" />
                      )}
                    </label>
                  );
                })
              )}
            </div>
          </ScrollArea>

          {/* Selected count + Apply */}
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <span className="text-xs text-muted-foreground">
              {selectedKitIds.size > 0
                ? `${selectedKitIds.size} kit selezionat${selectedKitIds.size === 1 ? 'o' : 'i'}`
                : 'Nessun kit selezionato'}
            </span>
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-emerald-600 hover:bg-emerald-700"
              onClick={handleBulkApply}
              disabled={applying || selectedKitIds.size === 0}
            >
              {applying ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Applica
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background-color: hsl(var(--border)); border-radius: 9999px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background-color: hsl(var(--muted-foreground)); }
      `}} />
    </div>
  );
}

// ============================================================================
// Export helper for parent components
// ============================================================================
export { normalizeConfig };
