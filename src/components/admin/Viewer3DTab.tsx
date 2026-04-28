'use client';

import { useState, useEffect, useCallback, useMemo, useRef, forwardRef, useImperativeHandle, memo } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  Camera,
  RotateCw,
  MousePointer,
  Lightbulb,
  Cloud,
  Sparkles,
  Palette,
  Eye,
  Shirt,
  Layers,
  Sun,
  Droplets,
  Aperture,
  MonitorSmartphone,
  Film,
  Grid3x3,
  Box,
  Tv,
  Zap,
  Search,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useViewerConfig } from '@/hooks/useViewer3DConfig';
import KitViewer3D from '@/components/KitViewer3D';
import { HoverTooltip } from '@/components/HoverTooltip';
import PresetsManager, { normalizeConfig } from '@/components/admin/PresetsManager';
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

// ============================================================================
// Tipo per la configurazione
// ============================================================================
interface Viewer3DConfig {
  id: string;
  updatedAt: Date | string;
  cameraInitialDistance: number;
  cameraFov: number;
  cameraMinDistance: number;
  cameraMaxDistance: number;
  cameraFreeRotation: boolean;
  rotationMinPolarAngle: number;
  rotationMaxPolarAngle: number;
  autoRotateEnabled: boolean;
  autoRotateSpeed: number;
  autoRotateResumeDelay: number;
  controlsEnablePan: boolean;
  controlsEnablePanHorizontal: boolean;
  controlsEnablePanVertical: boolean;
  controlsRotateSpeed: number;
  controlsZoomSpeed: number;
  controlsPanSpeed: number;
  controlsEnableDamping: boolean;
  controlsDampingFactor: number;
  controlsMaxPanHorizontal: number;
  controlsMaxPanVertical: number;
  modelTargetSize: number;
  lightingAmbientIntensity: number;
  lightingMainLightPositionX: number;
  lightingMainLightPositionY: number;
  lightingMainLightPositionZ: number;
  lightingMainLightIntensity: number;
  lightingSecondaryLightPositionX: number;
  lightingSecondaryLightPositionY: number;
  lightingSecondaryLightPositionZ: number;
  lightingSecondaryLightIntensity: number;
  shadowsEnabled: boolean;
  shadowsPositionX: number;
  shadowsPositionY: number;
  shadowsPositionZ: number;
  shadowsOpacity: number;
  shadowsScale: number;
  shadowsBlur: number;
  shadowsFar: number;
  shadowsResolution: number;
  effectsEnabled: boolean;
  effectsEnvMapIntensity: number;
  effectsRoughness: number;
  effectsMetalness: number;
  effectsToneMappingWhitePoint: number;
  effectsToneMappingMiddleGrey: number;
  effectsVignetteOffset: number;
  effectsVignetteDarkness: number;
  bloomEnabled: boolean;
  bloomIntensity: number;
  bloomLuminanceThreshold: number;
  bloomLuminanceSmoothing: number;
  aoEnabled: boolean;
  aoIntensity: number;
  aoDistance: number;
  aoFalloff: number;
  brightnessContrastEnabled: boolean;
  brightness: number;
  contrast: number;
  hueSaturationEnabled: boolean;
  hue: number;
  saturation: number;
  chromaticAberrationEnabled: boolean;
  chromaticAberrationOffset: number;
  depthOfFieldEnabled: boolean;
  depthOfFieldFocusDistance: number;
  depthOfFieldFocalLength: number;
  depthOfFieldBokehScale: number;
  tiltShiftEnabled: boolean;
  tiltShiftBlur: number;
  tiltShiftStart: number;
  tiltShiftEnd: number;
  noiseEnabled: boolean;
  noiseOpacity: number;
  dotScreenEnabled: boolean;
  dotScreenAngle: number;
  dotScreenScale: number;
  pixelationEnabled: boolean;
  pixelationGranularity: number;
  scanlineEnabled: boolean;
  scanlineDensity: number;
  scanlineOpacity: number;
  glitchEnabled: boolean;
  glitchDelay: number;
  glitchDuration: number;
  glitchStrength: number;
  backgroundColor: string;
}

const defaultConfig: Viewer3DConfig = {
  id: 'viewer3d-config',
  updatedAt: new Date(),
  cameraInitialDistance: 6,
  cameraFov: 50,
  cameraMinDistance: 3.5,
  cameraMaxDistance: 6,
  cameraFreeRotation: false,
  rotationMinPolarAngle: 90,
  rotationMaxPolarAngle: 90,
  autoRotateEnabled: true,
  autoRotateSpeed: 1.5,
  autoRotateResumeDelay: 2000,
  controlsEnablePan: true,
  controlsEnablePanHorizontal: false,
  controlsEnablePanVertical: true,
  controlsRotateSpeed: 0.5,
  controlsZoomSpeed: 1.2,
  controlsPanSpeed: 1,
  controlsEnableDamping: true,
  controlsDampingFactor: 0.05,
  controlsMaxPanHorizontal: 3,
  controlsMaxPanVertical: 2,
  modelTargetSize: 5,
  lightingAmbientIntensity: 0.7,
  lightingMainLightPositionX: 5,
  lightingMainLightPositionY: 10,
  lightingMainLightPositionZ: 7.5,
  lightingMainLightIntensity: 1.5,
  lightingSecondaryLightPositionX: -5,
  lightingSecondaryLightPositionY: 5,
  lightingSecondaryLightPositionZ: -7.5,
  lightingSecondaryLightIntensity: 0.8,
  shadowsEnabled: true,
  shadowsPositionX: 0,
  shadowsPositionY: -2.45,
  shadowsPositionZ: 0,
  shadowsOpacity: 0.5,
  shadowsScale: 10,
  shadowsBlur: 2,
  shadowsFar: 10,
  shadowsResolution: 1024,
  effectsEnabled: true,
  effectsEnvMapIntensity: 1.5,
  effectsRoughness: 0.4,
  effectsMetalness: 0.1,
  effectsToneMappingWhitePoint: 4.0,
  effectsToneMappingMiddleGrey: 0.6,
  effectsVignetteOffset: 0.3,
  effectsVignetteDarkness: 0.5,
  bloomEnabled: false,
  bloomIntensity: 0.5,
  bloomLuminanceThreshold: 0.9,
  bloomLuminanceSmoothing: 0.025,
  aoEnabled: false,
  aoIntensity: 2.0,
  aoDistance: 0.2,
  aoFalloff: 0.01,
  brightnessContrastEnabled: false,
  brightness: 0,
  contrast: 0,
  hueSaturationEnabled: false,
  hue: 0,
  saturation: 0,
  chromaticAberrationEnabled: false,
  chromaticAberrationOffset: 0.002,
  depthOfFieldEnabled: false,
  depthOfFieldFocusDistance: 0.01,
  depthOfFieldFocalLength: 0.02,
  depthOfFieldBokehScale: 3,
  tiltShiftEnabled: false,
  tiltShiftBlur: 0.05,
  tiltShiftStart: 0.49,
  tiltShiftEnd: 0.5,
  noiseEnabled: false,
  noiseOpacity: 0.05,
  dotScreenEnabled: false,
  dotScreenAngle: 1.39,
  dotScreenScale: 1,
  pixelationEnabled: false,
  pixelationGranularity: 5,
  scanlineEnabled: false,
  scanlineDensity: 1.5,
  scanlineOpacity: 0.1,
  glitchEnabled: false,
  glitchDelay: 3,
  glitchDuration: 0.6,
  glitchStrength: 0.3,
  backgroundColor: '#1a1a1a',
};

interface KitPreview {
  id: string;
  name: string;
  team: string;
  updatedAt?: string | Date;
}

export interface Viewer3DTabRef {
  hasChanges: boolean;
  saving: boolean;
  handleReset: () => void;
  handleResetDefault: () => void;
  handleSave: () => void;
  handleRefreshKits: () => void;
  selectedKitId: string;
  hasKitConfig: boolean;
  savingGlobal: boolean;
}

interface Viewer3DTabProps {
  adminToken: string;
  onStateChange?: (state: { hasChanges: boolean; saving: boolean; hasKitConfig: boolean; selectedKitId: string; savingGlobal: boolean }) => void;
}

// ============================================================================
// ConfigSlider — DEFINITO FUORI dal parent con memo.
// Usa configKey + onUpdate (stabile via useCallback([], [])) così memo
// funziona correttamente: re-render solo quando value cambia.
// ============================================================================
interface ConfigSliderProps {
  label: string;
  value: number;
  configKey: keyof Viewer3DConfig;
  onUpdate: <K extends keyof Viewer3DConfig>(key: K, value: Viewer3DConfig[K]) => void;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
}

const ConfigSlider = memo(function ConfigSlider({
  label,
  value,
  configKey,
  onUpdate,
  min = 0,
  max = 10,
  step = 0.1,
}: ConfigSliderProps) {
  const safeValue = value ?? 0;
  const [inputValue, setInputValue] = useState(safeValue.toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setInputValue(safeValue.toString());
  }, [safeValue, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      // Arronda al passo del solo slider per evitare float imprecisi,
      // ma accetta qualsiasi valore inserito manualmente
      const decimals = (step.toString().split('.')[1] || '').length;
      const rounded = parseFloat(clamped.toFixed(Math.max(decimals, 3)));
      onUpdate(configKey, rounded as any);
    } else {
      setInputValue(value.toString());
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleInputBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsEditing(true)}
          onBlur={handleInputBlur}
          onKeyDown={handleInputKeyDown}
          className="w-14 h-6 text-xs font-mono text-right px-1"
        />
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onUpdate(configKey, v as any)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
});

// ============================================================================
// ConfigSwitch — DEFINITO FUORI dal parent con memo.
// ============================================================================
interface ConfigSwitchProps {
  label: string;
  value: boolean;
  configKey: keyof Viewer3DConfig;
  onUpdate: <K extends keyof Viewer3DConfig>(key: K, value: Viewer3DConfig[K]) => void;
  description?: string;
}

const ConfigSwitch = memo(function ConfigSwitch({
  label,
  value,
  configKey,
  onUpdate,
  description,
}: ConfigSwitchProps) {
  return (
    <div className="flex items-center justify-between py-1">
      <div>
        <Label className="text-xs">{label}</Label>
        {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
      </div>
      <Switch
        checked={value}
        onCheckedChange={(v) => onUpdate(configKey, v as any)}
      />
    </div>
  );
});

// ============================================================================
// ConvertedConfig type
// ============================================================================
interface ConvertedConfig {
  camera: { initialDistance: number; fov: number; minDistance: number; maxDistance: number };
  rotation: { freeRotation: boolean; minPolarAngle: number; maxPolarAngle: number };
  autoRotate: { enabled: boolean; speed: number; resumeDelay: number };
  controls: { enablePan: boolean; enablePanHorizontal: boolean; enablePanVertical: boolean; rotateSpeed: number; zoomSpeed: number; panSpeed: number; enableDamping: boolean; dampingFactor: number; maxPanHorizontal: number; maxPanVertical: number };
  model: { targetSize: number };
  lighting: { ambientIntensity: number; mainLight: { position: [number, number, number]; intensity: number }; secondaryLight: { position: [number, number, number]; intensity: number }; fillLights: { position: [number, number, number]; intensity: number }[] };
  shadows: { enabled: boolean; position: [number, number, number]; opacity: number; scale: number; blur: number; far: number; resolution: number };
  effects: { enabled: boolean; envMapIntensity: number; roughness: number; metalness: number; toneMappingWhitePoint: number; toneMappingMiddleGrey: number; vignetteOffset: number; vignetteDarkness: number };
  bloom: { enabled: boolean; intensity: number; luminanceThreshold: number; luminanceSmoothing: number };
  ao: { enabled: boolean; intensity: number; distance: number; falloff: number };
  brightnessContrast: { enabled: boolean; brightness: number; contrast: number };
  hueSaturation: { enabled: boolean; hue: number; saturation: number };
  chromaticAberration: { enabled: boolean; offset: number };
  depthOfField: { enabled: boolean; focusDistance: number; focalLength: number; bokehScale: number };
  tiltShift: { enabled: boolean; blur: number; start: number; end: number };
  noise: { enabled: boolean; opacity: number };
  dotScreen: { enabled: boolean; angle: number; scale: number };
  pixelation: { enabled: boolean; granularity: number };
  scanline: { enabled: boolean; density: number; opacity: number };
  glitch: { enabled: boolean; delay: number; duration: number; strength: number };
  backgroundColor: string;
}

// ============================================================================
// PreviewPanel — memoizzato, ricece solo la stringa JSON debounced
// ============================================================================
interface PreviewPanelProps {
  configJson: string;
  selectedKitId: string;
  backgroundColor: string;
  modelCacheKey: string;
}

const PreviewPanel = memo(function PreviewPanel({ configJson, selectedKitId, backgroundColor, modelCacheKey }: PreviewPanelProps) {
  const [liveConfig, setLiveConfig] = useState<ConvertedConfig | null>(null);

  useEffect(() => {
    try {
      setLiveConfig(JSON.parse(configJson));
    } catch {
      // ignora errori di parsing
    }
  }, [configJson]);

  return (
    <Card className="border-border flex flex-col h-full">
      <CardContent className="flex-1 p-0">
        <div className="w-full h-full min-h-[400px] lg:min-h-0 relative" style={{ backgroundColor }}>
          {selectedKitId && liveConfig ? (
            <KitViewer3D key={modelCacheKey} modelUrl={`/api/kits/${selectedKitId}/model3d?v=${modelCacheKey}`} config={liveConfig} className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-muted-foreground"><Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" /><p className="text-sm">Nessun modello</p></div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// Viewer3DTab — componente principale
// ============================================================================
const Viewer3DTab = forwardRef<Viewer3DTabRef, Viewer3DTabProps>(
  ({ adminToken, onStateChange }, ref) => {
    const { toast } = useToast();
    const { refetch: refetchGlobalConfig } = useViewerConfig();
    const [config, setConfig] = useState<Viewer3DConfig>(defaultConfig);
    const [loading, setLoading] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalConfig, setOriginalConfig] = useState<Viewer3DConfig>(defaultConfig);
    const [kits, setKits] = useState<KitPreview[]>([]);
    const [selectedKitId, setSelectedKitId] = useState<string>('');
    const [loadingKits, setLoadingKits] = useState(true);
    const [kitSearch, setKitSearch] = useState('');
    const [hasKitConfig, setHasKitConfig] = useState(false);
    const [savingGlobal, setSavingGlobal] = useState(false);
    const [showDeleteKitDialog, setShowDeleteKitDialog] = useState(false);

    // Presets per il matching del badge
    const [presetsList, setPresetsList] = useState<Array<{ id: string; name: string; config: string }>>([]);

    // Stable callback per evitare loop infinito con PresetsManager
    const handlePresetsChange = useCallback((list: Array<{ id: string; name: string; config: string }>) => {
      setPresetsList(list);
    }, []);

    // Stable updateConfig — useCallback con [] = riferimento stabile per memo dei figli
    const updateConfig = useCallback(<K extends keyof Viewer3DConfig>(key: K, value: Viewer3DConfig[K]) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    // Carica configurazione
    useEffect(() => {
      fetch('/api/viewer3d-config')
        .then(res => res.json())
        .then(data => {
          const merged = { ...defaultConfig, ...data };
          setConfig(merged);
          setOriginalConfig(merged);
        })
        .catch(err => {
          console.error('Error fetching config:', err);
          toast({ title: 'Errore', description: 'Impossibile caricare la configurazione', variant: 'destructive' });
        })
        .finally(() => setLoading(false));
    }, [toast]);

    // Carica kit con modello 3D
    const fetchKits = useCallback(() => {
      setLoadingKits(true);
      fetch('/api/kits')
        .then(res => res.json())
        .then(data => {
          const kitsWithModel = data.filter((k: any) => k.hasModel3D);
          setKits(kitsWithModel);
          if (kitsWithModel.length > 0 && !selectedKitId) {
            setSelectedKitId(kitsWithModel[0].id);
          }
        })
        .catch(console.error)
        .finally(() => setLoadingKits(false));
    }, [selectedKitId]);

    useEffect(() => {
      fetchKits();
    }, [fetchKits]);

    // Filtra kit in base alla ricerca
    const filteredKits = useMemo(() => {
      if (!kitSearch.trim()) return kits;
      const q = kitSearch.toLowerCase();
      return kits.filter(k => k.name.toLowerCase().includes(q) || k.team.toLowerCase().includes(q));
    }, [kits, kitSearch]);

    // Lista kit per il PresetsManager (stabile, con hasModel3D=true per tutti quelli passati)
    const presetsKitsList = useMemo(() => kits.map(k => ({ id: k.id, name: k.name, team: k.team, hasModel3D: true })), [kits]);

    // Cache buster per il modello 3D: cambia quando updatedAt del kit cambia
    const selectedKit = useMemo(() => kits.find(k => k.id === selectedKitId), [kits, selectedKitId]);
    const modelCacheKey = useMemo(() => {
      if (!selectedKit?.updatedAt) return `${selectedKitId}-0`;
      return `${selectedKitId}-${new Date(selectedKit.updatedAt).getTime()}`;
    }, [selectedKitId, selectedKit?.updatedAt]);

    // Quando si seleziona un kit, carica la sua config per-kit (se esiste)
    useEffect(() => {
      if (!selectedKitId) { setHasKitConfig(false); return; }
      fetch(`/api/kits/${selectedKitId}/viewer3d-config`)
        .then(res => res.json())
        .then(data => {
          if (data && data.found !== false) {
            const merged = { ...defaultConfig, ...data };
            setConfig(merged);
            setOriginalConfig(merged);
            setHasKitConfig(true);
          } else {
            // Nessuna config per-kit → ricarica globale
            fetch('/api/viewer3d-config')
              .then(res => res.json())
              .then(globalData => { const merged = { ...defaultConfig, ...globalData }; setConfig(merged); setOriginalConfig(merged); })
              .catch(() => {});
            setHasKitConfig(false);
          }
        })
        .catch(() => setHasKitConfig(false));
    }, [selectedKitId]);

    // Controlla modifiche
    useEffect(() => {
      const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(changed);
    }, [config, originalConfig]);

    const handleReset = useCallback(() => {
      setConfig(originalConfig);
    }, [originalConfig]);

    const handleResetDefault = useCallback(() => {
      setConfig(defaultConfig);
    }, []);

    const handleSave = useCallback(() => {
      if (!adminToken) {
        toast({ title: 'Errore', description: 'Token non trovato', variant: 'destructive' });
        return;
      }

      setSavingGlobal(true);
      fetch('/api/viewer3d-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, adminToken }),
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) throw new Error(data.details || data.error || 'Failed to save');
          return data;
        })
        .then(saved => {
          setConfig(saved);
          setOriginalConfig(saved);
          setHasChanges(false);
          refetchGlobalConfig();
          toast({ title: 'Successo', description: 'Configurazione globale salvata' });
        })
        .catch(err => {
          console.error(err);
          toast({ title: 'Errore', description: err.message || 'Impossibile salvare', variant: 'destructive' });
        })
        .finally(() => setSavingGlobal(false));
    }, [adminToken, config, toast, refetchGlobalConfig]);

    // Rimuovi config per-kit e ricarica globale
    const handleDeleteKitConfig = useCallback(() => {
      if (!adminToken) {
        toast({ title: 'Errore', description: 'Token non trovato', variant: 'destructive' });
        return;
      }
      if (!selectedKitId) return;

      fetch(`/api/kits/${selectedKitId}/viewer3d-config`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminToken }),
      })
        .then(async res => {
          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.details || data.error || 'Failed to delete');
          }
        })
        .then(() => {
          setHasKitConfig(false);
          // Ricarica la config globale
          fetch('/api/viewer3d-config')
            .then(res => res.json())
            .then(globalData => {
              const merged = { ...defaultConfig, ...globalData };
              setConfig(merged);
              setOriginalConfig(merged);
              setHasChanges(false);
            })
            .catch(() => {});
          toast({ title: 'Successo', description: 'Configurazione kit rimossa' });
        })
        .catch(err => {
          console.error(err);
          toast({ title: 'Errore', description: err.message || 'Impossibile rimuovere la configurazione', variant: 'destructive' });
        });
    }, [adminToken, selectedKitId, toast]);

    // Notifica il padre ad ogni cambio di stato rilevante
    useEffect(() => {
      onStateChange?.({
        hasChanges,
        saving: savingGlobal,
        hasKitConfig,
        selectedKitId,
        savingGlobal,
      });
    }, [hasChanges, savingGlobal, hasKitConfig, selectedKitId, onStateChange]);

    // Esponi funzioni al padre
    useImperativeHandle(ref, () => ({
      hasChanges,
      saving: savingGlobal,
      handleReset,
      handleResetDefault,
      handleSave,
      handleRefreshKits: fetchKits,
      selectedKitId,
      hasKitConfig,
      savingGlobal,
    }), [hasChanges, savingGlobal, handleReset, handleResetDefault, handleSave, fetchKits, selectedKitId, hasKitConfig]);

    // Converte config per viewer
    const viewerConfig = useMemo(() => ({
      camera: {
        initialDistance: config.cameraInitialDistance,
        fov: config.cameraFov,
        minDistance: config.cameraMinDistance,
        maxDistance: config.cameraMaxDistance,
      },
      rotation: {
        freeRotation: config.cameraFreeRotation,
        minPolarAngle: (config.rotationMinPolarAngle * Math.PI) / 180,
        maxPolarAngle: (config.rotationMaxPolarAngle * Math.PI) / 180,
      },
      autoRotate: {
        enabled: config.autoRotateEnabled,
        speed: config.autoRotateSpeed,
        resumeDelay: config.autoRotateResumeDelay,
      },
      controls: {
        enablePan: config.controlsEnablePan,
        enablePanHorizontal: config.controlsEnablePanHorizontal,
        enablePanVertical: config.controlsEnablePanVertical,
        rotateSpeed: config.controlsRotateSpeed,
        zoomSpeed: config.controlsZoomSpeed,
        panSpeed: config.controlsPanSpeed,
        enableDamping: config.controlsEnableDamping,
        dampingFactor: config.controlsDampingFactor,
        maxPanHorizontal: config.controlsMaxPanHorizontal,
        maxPanVertical: config.controlsMaxPanVertical,
      },
      model: { targetSize: config.modelTargetSize },
      lighting: {
        ambientIntensity: config.lightingAmbientIntensity,
        mainLight: {
          position: [config.lightingMainLightPositionX, config.lightingMainLightPositionY, config.lightingMainLightPositionZ] as [number, number, number],
          intensity: config.lightingMainLightIntensity,
        },
        secondaryLight: {
          position: [config.lightingSecondaryLightPositionX, config.lightingSecondaryLightPositionY, config.lightingSecondaryLightPositionZ] as [number, number, number],
          intensity: config.lightingSecondaryLightIntensity,
        },
        fillLights: [],
      },
      shadows: {
        enabled: config.shadowsEnabled,
        position: [config.shadowsPositionX, config.shadowsPositionY, config.shadowsPositionZ] as [number, number, number],
        opacity: config.shadowsOpacity,
        scale: config.shadowsScale,
        blur: config.shadowsBlur,
        far: config.shadowsFar,
        resolution: config.shadowsResolution,
      },
      effects: {
        enabled: config.effectsEnabled,
        envMapIntensity: config.effectsEnvMapIntensity,
        roughness: config.effectsRoughness,
        metalness: config.effectsMetalness,
        toneMappingWhitePoint: config.effectsToneMappingWhitePoint,
        toneMappingMiddleGrey: config.effectsToneMappingMiddleGrey,
        vignetteOffset: config.effectsVignetteOffset,
        vignetteDarkness: config.effectsVignetteDarkness,
      },
      bloom: {
        enabled: config.bloomEnabled,
        intensity: config.bloomIntensity,
        luminanceThreshold: config.bloomLuminanceThreshold,
        luminanceSmoothing: config.bloomLuminanceSmoothing,
      },
      ao: {
        enabled: config.aoEnabled,
        intensity: config.aoIntensity,
        distance: config.aoDistance,
        falloff: config.aoFalloff,
      },
      brightnessContrast: {
        enabled: config.brightnessContrastEnabled,
        brightness: config.brightness,
        contrast: config.contrast,
      },
      hueSaturation: {
        enabled: config.hueSaturationEnabled,
        hue: config.hue,
        saturation: config.saturation,
      },
      chromaticAberration: {
        enabled: config.chromaticAberrationEnabled,
        offset: config.chromaticAberrationOffset,
      },
      depthOfField: {
        enabled: config.depthOfFieldEnabled,
        focusDistance: config.depthOfFieldFocusDistance,
        focalLength: config.depthOfFieldFocalLength,
        bokehScale: config.depthOfFieldBokehScale,
      },
      tiltShift: {
        enabled: config.tiltShiftEnabled,
        blur: config.tiltShiftBlur,
        start: config.tiltShiftStart,
        end: config.tiltShiftEnd,
      },
      noise: {
        enabled: config.noiseEnabled,
        opacity: config.noiseOpacity,
      },
      dotScreen: {
        enabled: config.dotScreenEnabled,
        angle: config.dotScreenAngle,
        scale: config.dotScreenScale,
      },
      pixelation: {
        enabled: config.pixelationEnabled,
        granularity: config.pixelationGranularity,
      },
      scanline: {
        enabled: config.scanlineEnabled,
        density: config.scanlineDensity,
        opacity: config.scanlineOpacity,
      },
      glitch: {
        enabled: config.glitchEnabled,
        delay: config.glitchDelay,
        duration: config.glitchDuration,
        strength: config.glitchStrength,
      },
      backgroundColor: config.backgroundColor,
    }), [config]);

    // Debounce della stringa JSON per la PreviewPanel
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [debouncedConfigJson, setDebouncedConfigJson] = useState(() => JSON.stringify(viewerConfig));

    useEffect(() => {
      const json = JSON.stringify(viewerConfig);
      if (json === debouncedConfigJson) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => setDebouncedConfigJson(json), 150);
      return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
    }, [viewerConfig, debouncedConfigJson]);

    if (loading) {
      return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
    }

    return (
      <>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full pb-2">
        {/* Controlli */}
        <Card className="border-border flex flex-col h-full">
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Selezione Kit + Colore sfondo */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <Card className="border-border">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" /> Anteprima Modello
                    {(() => {
                      try {
                        const configFingerprint = normalizeConfig(config);
                        let badge = null;
                        if (hasKitConfig && presetsList.length > 0) {
                          for (const p of presetsList) {
                            try {
                              if (normalizeConfig(p.config) === configFingerprint) {
                                badge = p.name;
                                break;
                              }
                            } catch { /* skip invalid preset */ }
                          }
                        }
                        return (
                          <div className="ml-auto flex items-center gap-1.5">
                            {badge ? (
                              <HoverTooltip text={badge} side="top">
                              <span className="text-[10px] bg-amber-500/20 text-amber-600 px-1.5 py-0.5 rounded-full truncate max-w-[120px]">{badge}</span>
                              </HoverTooltip>
                            ) : hasKitConfig ? (
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded-full">Config kit</span>
                            ) : null}
                            {hasKitConfig && (
                              <HoverTooltip text="Rimuovi configurazione personalizzata" side="top">
                              <button
                                type="button"
                                onClick={() => setShowDeleteKitDialog(true)}
                                className="p-0.5 rounded hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              </HoverTooltip>
                            )}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3 space-y-2">
                  {loadingKits ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs text-muted-foreground">Caricamento...</span></div>
                  ) : kits.length === 0 ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Shirt className="w-4 h-4" /><span className="text-xs">Nessun kit 3D</span></div>
                  ) : (
                    <>
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Cerca kit..."
                          value={kitSearch}
                          onChange={e => setKitSearch(e.target.value)}
                          className="h-7 pl-8 text-xs"
                        />
                      </div>
                      <Select value={selectedKitId} onValueChange={setSelectedKitId}>
                        <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                        <SelectContent className="max-h-48">
                          {filteredKits.map(k => <SelectItem key={k.id} value={k.id}>{k.name} - {k.team}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {kitSearch && filteredKits.length === 0 && (
                        <p className="text-[10px] text-muted-foreground text-center">Nessun kit trovato</p>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardHeader className="py-2 px-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" /> Colore Sfondo
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-8 rounded border" style={{ backgroundColor: config.backgroundColor }} />
                    <Input type="color" value={config.backgroundColor} onChange={e => updateConfig('backgroundColor', e.target.value)} className="w-14 h-8" />
                    <Input value={config.backgroundColor} onChange={e => updateConfig('backgroundColor', e.target.value)} className="w-20 font-mono text-xs h-8" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Accordion impostazioni */}
            <Accordion type="multiple" defaultValue={['presets', 'camera', 'effects']} className="space-y-2">
              <AccordionItem value="presets" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-emerald-400" /><span>Presets</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <PresetsManager
                    adminToken={adminToken}
                    currentConfig={config as unknown as Record<string, any>}
                    onLoadPreset={(presetConfig) => {
                      setConfig(presetConfig as unknown as Viewer3DConfig);
                      setOriginalConfig(presetConfig as unknown as Viewer3DConfig);
                      setHasChanges(false);
                    }}
                    onPresetsChange={handlePresetsChange}
                    kits={presetsKitsList}
                  />
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="camera" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Camera className="w-4 h-4 text-blue-400" /><span>Camera</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="space-y-3">
                    <ConfigSwitch label="Rotazione libera 360°" value={config.cameraFreeRotation} configKey="cameraFreeRotation" onUpdate={updateConfig} description="Permette di ruotare il modello liberamente su tutti gli assi" />
                    <div className="grid grid-cols-2 gap-3">
                      <ConfigSlider label="Distanza" value={config.cameraInitialDistance} configKey="cameraInitialDistance" onUpdate={updateConfig} min={2} max={15} />
                      <ConfigSlider label="FOV" value={config.cameraFov} configKey="cameraFov" onUpdate={updateConfig} min={20} max={120} />
                      <ConfigSlider label="Min zoom" value={config.cameraMinDistance} configKey="cameraMinDistance" onUpdate={updateConfig} min={1} max={10} />
                      <ConfigSlider label="Max zoom" value={config.cameraMaxDistance} configKey="cameraMaxDistance" onUpdate={updateConfig} min={3} max={20} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rotation" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><RotateCw className="w-4 h-4 text-green-400" /><span>Auto-Rotazione</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attiva" value={config.autoRotateEnabled} configKey="autoRotateEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Velocità" value={config.autoRotateSpeed} configKey="autoRotateSpeed" onUpdate={updateConfig} min={0.1} max={5} step={0.1} />
                    <ConfigSlider label="Delay (ms)" value={config.autoRotateResumeDelay} configKey="autoRotateResumeDelay" onUpdate={updateConfig} min={500} max={5000} step={100} />
                    <ConfigSlider label="Angolo min" value={config.rotationMinPolarAngle} configKey="rotationMinPolarAngle" onUpdate={updateConfig} min={0} max={180} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="controls" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><MousePointer className="w-4 h-4 text-amber-400" /><span>Controlli</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Pan orizz." value={config.controlsEnablePanHorizontal} configKey="controlsEnablePanHorizontal" onUpdate={updateConfig} />
                    <ConfigSwitch label="Pan vert." value={config.controlsEnablePanVertical} configKey="controlsEnablePanVertical" onUpdate={updateConfig} />
                    <ConfigSlider label="Rotazione" value={config.controlsRotateSpeed} configKey="controlsRotateSpeed" onUpdate={updateConfig} min={0.1} max={2} step={0.1} />
                    <ConfigSlider label="Zoom" value={config.controlsZoomSpeed} configKey="controlsZoomSpeed" onUpdate={updateConfig} min={0.1} max={3} step={0.1} />
                    <ConfigSlider label="Damping" value={config.controlsDampingFactor} configKey="controlsDampingFactor" onUpdate={updateConfig} min={0.01} max={0.5} step={0.01} />
                    <ConfigSlider label="Max pan orizz." value={config.controlsMaxPanHorizontal} configKey="controlsMaxPanHorizontal" onUpdate={updateConfig} min={0} max={10} step={0.1} />
                    <ConfigSlider label="Max pan vert." value={config.controlsMaxPanVertical} configKey="controlsMaxPanVertical" onUpdate={updateConfig} min={0} max={10} step={0.1} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="lighting" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-400" /><span>Illuminazione</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <ConfigSlider label="Ambiente" value={config.lightingAmbientIntensity} configKey="lightingAmbientIntensity" onUpdate={updateConfig} min={0} max={2} step={0.1} />
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Luce principale</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ConfigSlider label="X" value={config.lightingMainLightPositionX} configKey="lightingMainLightPositionX" onUpdate={updateConfig} min={-20} max={20} />
                      <ConfigSlider label="Y" value={config.lightingMainLightPositionY} configKey="lightingMainLightPositionY" onUpdate={updateConfig} min={-20} max={20} />
                      <ConfigSlider label="Z" value={config.lightingMainLightPositionZ} configKey="lightingMainLightPositionZ" onUpdate={updateConfig} min={-20} max={20} />
                      <ConfigSlider label="Intensità" value={config.lightingMainLightIntensity} configKey="lightingMainLightIntensity" onUpdate={updateConfig} min={0} max={5} step={0.1} />
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Luce secondaria</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ConfigSlider label="X" value={config.lightingSecondaryLightPositionX} configKey="lightingSecondaryLightPositionX" onUpdate={updateConfig} min={-20} max={20} />
                      <ConfigSlider label="Y" value={config.lightingSecondaryLightPositionY} configKey="lightingSecondaryLightPositionY" onUpdate={updateConfig} min={-20} max={20} />
                      <ConfigSlider label="Z" value={config.lightingSecondaryLightPositionZ} configKey="lightingSecondaryLightPositionZ" onUpdate={updateConfig} min={-20} max={20} />
                      <ConfigSlider label="Intensità" value={config.lightingSecondaryLightIntensity} configKey="lightingSecondaryLightIntensity" onUpdate={updateConfig} min={0} max={5} step={0.1} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shadows" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Cloud className="w-4 h-4 text-gray-400" /><span>Ombre</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attive" value={config.shadowsEnabled} configKey="shadowsEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Opacità" value={config.shadowsOpacity} configKey="shadowsOpacity" onUpdate={updateConfig} min={0} max={1} step={0.05} />
                    <ConfigSlider label="Blur" value={config.shadowsBlur} configKey="shadowsBlur" onUpdate={updateConfig} min={0} max={10} step={0.1} />
                    <ConfigSlider label="Scala" value={config.shadowsScale} configKey="shadowsScale" onUpdate={updateConfig} min={1} max={30} step={0.5} />
                    <ConfigSlider label="Distanza (far)" value={config.shadowsFar} configKey="shadowsFar" onUpdate={updateConfig} min={1} max={20} step={0.5} />
                    <ConfigSlider label="Pos. Y" value={config.shadowsPositionY} configKey="shadowsPositionY" onUpdate={updateConfig} min={-5} max={0} step={0.05} />
                    <ConfigSlider label="Risoluzione" value={config.shadowsResolution} configKey="shadowsResolution" onUpdate={updateConfig} min={128} max={2048} step={128} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="effects" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-400" /><span>Effetti</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivi" value={config.effectsEnabled} configKey="effectsEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="EnvMap" value={config.effectsEnvMapIntensity} configKey="effectsEnvMapIntensity" onUpdate={updateConfig} min={0} max={3} step={0.1} />
                    <ConfigSlider label="Roughness" value={config.effectsRoughness} configKey="effectsRoughness" onUpdate={updateConfig} min={0} max={1} step={0.05} />
                    <ConfigSlider label="Metalness" value={config.effectsMetalness} configKey="effectsMetalness" onUpdate={updateConfig} min={0} max={1} step={0.05} />
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Tone Mapping</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ConfigSlider label="White point" value={config.effectsToneMappingWhitePoint} configKey="effectsToneMappingWhitePoint" onUpdate={updateConfig} min={0.5} max={10} step={0.1} />
                      <ConfigSlider label="Mid grey" value={config.effectsToneMappingMiddleGrey} configKey="effectsToneMappingMiddleGrey" onUpdate={updateConfig} min={0.1} max={1} step={0.05} />
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Vignette</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ConfigSlider label="Offset" value={config.effectsVignetteOffset} configKey="effectsVignetteOffset" onUpdate={updateConfig} min={0} max={1} step={0.05} />
                      <ConfigSlider label="Darkness" value={config.effectsVignetteDarkness} configKey="effectsVignetteDarkness" onUpdate={updateConfig} min={0} max={3} step={0.1} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bloom" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Sun className="w-4 h-4 text-yellow-400" /><span>Bloom</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.bloomEnabled} configKey="bloomEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Intensità" value={config.bloomIntensity} configKey="bloomIntensity" onUpdate={updateConfig} min={0} max={3} step={0.05} />
                    <ConfigSlider label="Soglia" value={config.bloomLuminanceThreshold} configKey="bloomLuminanceThreshold" onUpdate={updateConfig} min={0} max={2} step={0.05} />
                    <ConfigSlider label="Smoothing" value={config.bloomLuminanceSmoothing} configKey="bloomLuminanceSmoothing" onUpdate={updateConfig} min={0} max={0.5} step={0.005} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="ao" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-teal-400" /><span>Ambient Occlusion</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.aoEnabled} configKey="aoEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Intensità" value={config.aoIntensity} configKey="aoIntensity" onUpdate={updateConfig} min={0} max={5} step={0.1} />
                    <ConfigSlider label="Distanza" value={config.aoDistance} configKey="aoDistance" onUpdate={updateConfig} min={0} max={1} step={0.01} />
                    <ConfigSlider label="Falloff" value={config.aoFalloff} configKey="aoFalloff" onUpdate={updateConfig} min={0} max={0.1} step={0.001} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="brightnessContrast" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Droplets className="w-4 h-4 text-orange-400" /><span>Luminosità / Contrasto</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.brightnessContrastEnabled} configKey="brightnessContrastEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Luminosità" value={config.brightness} configKey="brightness" onUpdate={updateConfig} min={-1} max={1} step={0.05} />
                    <ConfigSlider label="Contrasto" value={config.contrast} configKey="contrast" onUpdate={updateConfig} min={-1} max={1} step={0.05} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="hueSaturation" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Palette className="w-4 h-4 text-rose-400" /><span>Tonalità / Saturazione</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.hueSaturationEnabled} configKey="hueSaturationEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Tonalità" value={config.hue} configKey="hue" onUpdate={updateConfig} min={0} max={1} step={0.01} />
                    <ConfigSlider label="Saturazione" value={config.saturation} configKey="saturation" onUpdate={updateConfig} min={-1} max={1} step={0.05} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="chromaticAberration" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Aperture className="w-4 h-4 text-violet-400" /><span>Aberrazione Cromatica</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.chromaticAberrationEnabled} configKey="chromaticAberrationEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Offset" value={config.chromaticAberrationOffset} configKey="chromaticAberrationOffset" onUpdate={updateConfig} min={0} max={0.01} step={0.0005} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="depthOfField" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Layers className="w-4 h-4 text-cyan-400" /><span>Profondità di Campo</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.depthOfFieldEnabled} configKey="depthOfFieldEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Fuoco" value={config.depthOfFieldFocusDistance} configKey="depthOfFieldFocusDistance" onUpdate={updateConfig} min={0} max={0.1} step={0.001} />
                    <ConfigSlider label="Focale" value={config.depthOfFieldFocalLength} configKey="depthOfFieldFocalLength" onUpdate={updateConfig} min={0} max={0.1} step={0.002} />
                    <ConfigSlider label="Bokeh" value={config.depthOfFieldBokehScale} configKey="depthOfFieldBokehScale" onUpdate={updateConfig} min={0} max={10} step={0.5} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="tiltShift" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><MonitorSmartphone className="w-4 h-4 text-sky-400" /><span>Tilt Shift</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.tiltShiftEnabled} configKey="tiltShiftEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Sfocatura" value={config.tiltShiftBlur} configKey="tiltShiftBlur" onUpdate={updateConfig} min={0} max={0.1} step={0.005} />
                    <ConfigSlider label="Inizio" value={config.tiltShiftStart} configKey="tiltShiftStart" onUpdate={updateConfig} min={0} max={0.9} step={0.01} />
                    <ConfigSlider label="Fine" value={config.tiltShiftEnd} configKey="tiltShiftEnd" onUpdate={updateConfig} min={0.1} max={1} step={0.01} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="noise" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Film className="w-4 h-4 text-stone-400" /><span>Grana (Noise)</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.noiseEnabled} configKey="noiseEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Opacità" value={config.noiseOpacity} configKey="noiseOpacity" onUpdate={updateConfig} min={0} max={1} step={0.01} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="dotScreen" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Grid3x3 className="w-4 h-4 text-emerald-400" /><span>Mezzi Toni (Dot Screen)</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.dotScreenEnabled} configKey="dotScreenEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Angolo" value={config.dotScreenAngle} configKey="dotScreenAngle" onUpdate={updateConfig} min={0} max={6.28} step={0.01} />
                    <ConfigSlider label="Scala" value={config.dotScreenScale} configKey="dotScreenScale" onUpdate={updateConfig} min={0.5} max={5} step={0.1} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="pixelation" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Box className="w-4 h-4 text-lime-400" /><span>Pixel Art</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.pixelationEnabled} configKey="pixelationEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Granularità" value={config.pixelationGranularity} configKey="pixelationGranularity" onUpdate={updateConfig} min={1} max={50} step={1} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="scanline" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Tv className="w-4 h-4 text-indigo-400" /><span>Scanline (CRT)</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.scanlineEnabled} configKey="scanlineEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Densità" value={config.scanlineDensity} configKey="scanlineDensity" onUpdate={updateConfig} min={0.5} max={5} step={0.1} />
                    <ConfigSlider label="Opacità" value={config.scanlineOpacity} configKey="scanlineOpacity" onUpdate={updateConfig} min={0} max={1} step={0.05} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="glitch" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Zap className="w-4 h-4 text-red-400" /><span>Glitch</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivo" value={config.glitchEnabled} configKey="glitchEnabled" onUpdate={updateConfig} />
                    <ConfigSlider label="Ritardo" value={config.glitchDelay} configKey="glitchDelay" onUpdate={updateConfig} min={0.5} max={10} step={0.5} />
                    <ConfigSlider label="Durata" value={config.glitchDuration} configKey="glitchDuration" onUpdate={updateConfig} min={0.1} max={3} step={0.1} />
                    <ConfigSlider label="Intensità" value={config.glitchStrength} configKey="glitchStrength" onUpdate={updateConfig} min={0} max={1} step={0.05} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Anteprima — memoizzato, riceve solo la stringa JSON debounced */}
        <PreviewPanel
          configJson={debouncedConfigJson}
          selectedKitId={selectedKitId}
          backgroundColor={config.backgroundColor}
          modelCacheKey={modelCacheKey}
        />
        </div>

        {/* Confirm delete kit config dialog */}
        <AlertDialog open={showDeleteKitDialog} onOpenChange={setShowDeleteKitDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Rimuovere configurazione personalizzata?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Verrà eliminata la configurazione 3D salvata per questo kit. Il kit tornerà a utilizzare la configurazione globale.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Annulla</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setShowDeleteKitDialog(false);
                  handleDeleteKitConfig();
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Rimuovi
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }
);

Viewer3DTab.displayName = 'Viewer3DTab';

export default Viewer3DTab;
