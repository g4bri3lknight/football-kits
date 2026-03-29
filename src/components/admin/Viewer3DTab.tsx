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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useViewerConfig } from '@/hooks/useViewer3DConfig';
import KitViewer3D from '@/components/KitViewer3D';

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
  backgroundColor: '#1a1a1a',
};

interface KitPreview {
  id: string;
  name: string;
  team: string;
}

export interface Viewer3DTabRef {
  hasChanges: boolean;
  saving: boolean;
  handleReset: () => void;
  handleResetDefault: () => void;
  handleSave: () => void;
}

interface Viewer3DTabProps {
  adminToken: string;
  onStateChange?: (hasChanges: boolean, saving: boolean) => void;
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
  const [inputValue, setInputValue] = useState(value.toString());
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) setInputValue(value.toString());
  }, [value, isEditing]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    setIsEditing(false);
    const num = parseFloat(inputValue);
    if (!isNaN(num)) {
      const clamped = Math.max(min, Math.min(max, num));
      onUpdate(configKey, Math.round(clamped / step) * step as any);
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
  controls: { enablePan: boolean; enablePanHorizontal: boolean; enablePanVertical: boolean; rotateSpeed: number; zoomSpeed: number; panSpeed: number; enableDamping: boolean; dampingFactor: number };
  model: { targetSize: number };
  lighting: { ambientIntensity: number; mainLight: { position: [number, number, number]; intensity: number }; secondaryLight: { position: [number, number, number]; intensity: number }; fillLights: { position: [number, number, number]; intensity: number }[] };
  shadows: { enabled: boolean; position: [number, number, number]; opacity: number; scale: number; blur: number; far: number; resolution: number };
  effects: { enabled: boolean; envMapIntensity: number; roughness: number; metalness: number; toneMappingWhitePoint: number; toneMappingMiddleGrey: number; vignetteOffset: number; vignetteDarkness: number };
  backgroundColor: string;
}

// ============================================================================
// PreviewPanel — memoizzato, ricece solo la stringa JSON debounced
// ============================================================================
interface PreviewPanelProps {
  configJson: string;
  selectedKitId: string;
  backgroundColor: string;
}

const PreviewPanel = memo(function PreviewPanel({ configJson, selectedKitId, backgroundColor }: PreviewPanelProps) {
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
            <KitViewer3D modelUrl={`/api/kits/${selectedKitId}/model3d`} config={liveConfig} className="w-full h-full" />
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
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [originalConfig, setOriginalConfig] = useState<Viewer3DConfig>(defaultConfig);
    const [kits, setKits] = useState<KitPreview[]>([]);
    const [selectedKitId, setSelectedKitId] = useState<string>('');
    const [loadingKits, setLoadingKits] = useState(true);

    // Stable updateConfig — useCallback con [] = riferimento stabile per memo dei figli
    const updateConfig = useCallback(<K extends keyof Viewer3DConfig>(key: K, value: Viewer3DConfig[K]) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

    // Carica configurazione
    useEffect(() => {
      fetch('/api/viewer3d-config')
        .then(res => res.json())
        .then(data => {
          setConfig(data);
          setOriginalConfig(data);
        })
        .catch(err => {
          console.error('Error fetching config:', err);
          toast({ title: 'Errore', description: 'Impossibile caricare la configurazione', variant: 'destructive' });
        })
        .finally(() => setLoading(false));
    }, [toast]);

    // Carica kit con modello 3D
    useEffect(() => {
      fetch('/api/kits')
        .then(res => res.json())
        .then(data => {
          const kitsWithModel = data.filter((k: any) => k.hasModel3D);
          setKits(kitsWithModel);
          if (kitsWithModel.length > 0) setSelectedKitId(kitsWithModel[0].id);
        })
        .catch(console.error)
        .finally(() => setLoadingKits(false));
    }, []);

    // Controlla modifiche
    useEffect(() => {
      const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
      setHasChanges(changed);
      onStateChange?.(changed, saving);
    }, [config, originalConfig, saving, onStateChange]);

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

      setSaving(true);
      fetch('/api/viewer3d-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, adminToken }),
      })
        .then(async res => {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.details || data.error || 'Failed to save');
          }
          return data;
        })
        .then(saved => {
          setConfig(saved);
          setOriginalConfig(saved);
          setHasChanges(false);
          refetchGlobalConfig();
          toast({ title: 'Successo', description: 'Configurazione salvata' });
        })
        .catch(err => {
          console.error(err);
          toast({ title: 'Errore', description: err.message || 'Impossibile salvare', variant: 'destructive' });
        })
        .finally(() => setSaving(false));
    }, [adminToken, config, toast, refetchGlobalConfig]);

    // Esponi funzioni al padre
    useImperativeHandle(ref, () => ({
      hasChanges,
      saving,
      handleReset,
      handleResetDefault,
      handleSave,
    }), [hasChanges, saving, handleReset, handleResetDefault, handleSave]);

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
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-2 px-3">
                  {loadingKits ? (
                    <div className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs text-muted-foreground">Caricamento...</span></div>
                  ) : kits.length === 0 ? (
                    <div className="flex items-center gap-2 text-muted-foreground"><Shirt className="w-4 h-4" /><span className="text-xs">Nessun kit 3D</span></div>
                  ) : (
                    <Select value={selectedKitId} onValueChange={setSelectedKitId}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>{kits.map(k => <SelectItem key={k.id} value={k.id}>{k.name} - {k.team}</SelectItem>)}</SelectContent>
                    </Select>
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
            <Accordion type="multiple" defaultValue={['camera', 'effects']} className="space-y-2">
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
                    <ConfigSlider label="Blur" value={config.shadowsBlur} configKey="shadowsBlur" onUpdate={updateConfig} min={0} max={10} step={0.5} />
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
            </Accordion>
          </CardContent>
        </Card>

        {/* Anteprima — memoizzato, riceve solo la stringa JSON debounced */}
        <PreviewPanel
          configJson={debouncedConfigJson}
          selectedKitId={selectedKitId}
          backgroundColor={config.backgroundColor}
        />
      </div>
    );
  }
);

Viewer3DTab.displayName = 'Viewer3DTab';

export default Viewer3DTab;
