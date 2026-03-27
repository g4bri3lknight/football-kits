'use client';

import { useState, useEffect, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
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

// Tipo per la configurazione
interface Viewer3DConfig {
  id: string;
  updatedAt: Date | string;
  cameraInitialDistance: number;
  cameraFov: number;
  cameraMinDistance: number;
  cameraMaxDistance: number;
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

    const updateConfig = useCallback(<K extends keyof Viewer3DConfig>(key: K, value: Viewer3DConfig[K]) => {
      setConfig(prev => ({ ...prev, [key]: value }));
    }, []);

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
          // Aggiorna il context globale per il KitDialog
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

    // Componenti UI
    const ConfigSlider = ({ label, value, onChange, min = 0, max = 10, step = 0.1, unit = '' }: {
      label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; unit?: string;
    }) => {
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
          onChange(Math.round(clamped / step) * step);
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
            onValueChange={([v]) => onChange(v)}
            min={min}
            max={max}
            step={step}
          />
        </div>
      );
    };

    const ConfigSwitch = ({ label, value, onChange, description }: {
      label: string; value: boolean; onChange: (v: boolean) => void; description?: string;
    }) => (
      <div className="flex items-center justify-between py-1">
        <div>
          <Label className="text-xs">{label}</Label>
          {description && <p className="text-[10px] text-muted-foreground">{description}</p>}
        </div>
        <Switch checked={value} onCheckedChange={onChange} />
      </div>
    );

    if (loading) {
      return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>;
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full pb-2">
        {/* Controlli */}
        <Card className="border-border flex flex-col h-full">
          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {/* Selezione Kit + Colore sfondo - stessa riga su desktop */}
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
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSlider label="Distanza" value={config.cameraInitialDistance} onChange={v => updateConfig('cameraInitialDistance', v)} min={2} max={15} />
                    <ConfigSlider label="FOV" value={config.cameraFov} onChange={v => updateConfig('cameraFov', v)} min={20} max={120} unit="°" />
                    <ConfigSlider label="Min zoom" value={config.cameraMinDistance} onChange={v => updateConfig('cameraMinDistance', v)} min={1} max={10} />
                    <ConfigSlider label="Max zoom" value={config.cameraMaxDistance} onChange={v => updateConfig('cameraMaxDistance', v)} min={3} max={20} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="rotation" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><RotateCw className="w-4 h-4 text-green-400" /><span>Auto-Rotazione</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attiva" value={config.autoRotateEnabled} onChange={v => updateConfig('autoRotateEnabled', v)} />
                    <ConfigSlider label="Velocità" value={config.autoRotateSpeed} onChange={v => updateConfig('autoRotateSpeed', v)} min={0.1} max={5} step={0.1} />
                    <ConfigSlider label="Delay (ms)" value={config.autoRotateResumeDelay} onChange={v => updateConfig('autoRotateResumeDelay', v)} min={500} max={5000} step={100} />
                    <ConfigSlider label="Angolo min" value={config.rotationMinPolarAngle} onChange={v => updateConfig('rotationMinPolarAngle', v)} min={0} max={180} unit="°" />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="controls" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><MousePointer className="w-4 h-4 text-amber-400" /><span>Controlli</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Pan orizz." value={config.controlsEnablePanHorizontal} onChange={v => updateConfig('controlsEnablePanHorizontal', v)} />
                    <ConfigSwitch label="Pan vert." value={config.controlsEnablePanVertical} onChange={v => updateConfig('controlsEnablePanVertical', v)} />
                    <ConfigSlider label="Rotazione" value={config.controlsRotateSpeed} onChange={v => updateConfig('controlsRotateSpeed', v)} min={0.1} max={2} step={0.1} />
                    <ConfigSlider label="Zoom" value={config.controlsZoomSpeed} onChange={v => updateConfig('controlsZoomSpeed', v)} min={0.1} max={3} step={0.1} />
                    <ConfigSlider label="Damping" value={config.controlsDampingFactor} onChange={v => updateConfig('controlsDampingFactor', v)} min={0.01} max={0.5} step={0.01} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="lighting" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Lightbulb className="w-4 h-4 text-yellow-400" /><span>Illuminazione</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-3">
                  <ConfigSlider label="Ambiente" value={config.lightingAmbientIntensity} onChange={v => updateConfig('lightingAmbientIntensity', v)} min={0} max={2} step={0.1} />
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Luce principale</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ConfigSlider label="X" value={config.lightingMainLightPositionX} onChange={v => updateConfig('lightingMainLightPositionX', v)} min={-20} max={20} />
                      <ConfigSlider label="Y" value={config.lightingMainLightPositionY} onChange={v => updateConfig('lightingMainLightPositionY', v)} min={-20} max={20} />
                      <ConfigSlider label="Z" value={config.lightingMainLightPositionZ} onChange={v => updateConfig('lightingMainLightPositionZ', v)} min={-20} max={20} />
                      <ConfigSlider label="Intensità" value={config.lightingMainLightIntensity} onChange={v => updateConfig('lightingMainLightIntensity', v)} min={0} max={5} step={0.1} />
                    </div>
                  </div>
                  <div className="border-t pt-2">
                    <p className="text-xs text-muted-foreground mb-2">Luce secondaria</p>
                    <div className="grid grid-cols-2 gap-2">
                      <ConfigSlider label="X" value={config.lightingSecondaryLightPositionX} onChange={v => updateConfig('lightingSecondaryLightPositionX', v)} min={-20} max={20} />
                      <ConfigSlider label="Intensità" value={config.lightingSecondaryLightIntensity} onChange={v => updateConfig('lightingSecondaryLightIntensity', v)} min={0} max={5} step={0.1} />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="shadows" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Cloud className="w-4 h-4 text-gray-400" /><span>Ombre</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attive" value={config.shadowsEnabled} onChange={v => updateConfig('shadowsEnabled', v)} />
                    <ConfigSlider label="Opacità" value={config.shadowsOpacity} onChange={v => updateConfig('shadowsOpacity', v)} min={0} max={1} step={0.05} />
                    <ConfigSlider label="Blur" value={config.shadowsBlur} onChange={v => updateConfig('shadowsBlur', v)} min={0} max={10} step={0.5} />
                    <ConfigSlider label="Risoluzione" value={config.shadowsResolution} onChange={v => updateConfig('shadowsResolution', v)} min={256} max={2048} step={256} />
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="effects" className="border rounded-lg border-border">
                <AccordionTrigger className="px-3 py-2 hover:no-underline text-sm"><div className="flex items-center gap-2"><Sparkles className="w-4 h-4 text-pink-400" /><span>Effetti</span></div></AccordionTrigger>
                <AccordionContent className="px-3 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <ConfigSwitch label="Attivi" value={config.effectsEnabled} onChange={v => updateConfig('effectsEnabled', v)} />
                    <ConfigSlider label="EnvMap" value={config.effectsEnvMapIntensity} onChange={v => updateConfig('effectsEnvMapIntensity', v)} min={0} max={3} step={0.1} />
                    <ConfigSlider label="Roughness" value={config.effectsRoughness} onChange={v => updateConfig('effectsRoughness', v)} min={0} max={1} step={0.05} />
                    <ConfigSlider label="Metalness" value={config.effectsMetalness} onChange={v => updateConfig('effectsMetalness', v)} min={0} max={1} step={0.05} />
                    <ConfigSlider label="Vignette off" value={config.effectsVignetteOffset} onChange={v => updateConfig('effectsVignetteOffset', v)} min={0} max={1} step={0.05} />
                    <ConfigSlider label="Vignette dark" value={config.effectsVignetteDarkness} onChange={v => updateConfig('effectsVignetteDarkness', v)} min={0} max={2} step={0.1} />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Anteprima */}
        <Card className="border-border flex flex-col h-full">
          <CardContent className="flex-1 p-0">
            <div className="w-full h-full min-h-[400px] lg:min-h-0 relative" style={{ backgroundColor: config.backgroundColor }}>
              {selectedKitId ? (
                <KitViewer3D modelUrl={`/api/kits/${selectedKitId}/model3d`} config={viewerConfig} className="w-full h-full" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground"><Shirt className="w-12 h-12 mx-auto mb-2 opacity-50" /><p className="text-sm">Nessun modello</p></div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
);

Viewer3DTab.displayName = 'Viewer3DTab';

export default Viewer3DTab;
