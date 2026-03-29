'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

// Tipo per la configurazione del viewer 3D
export interface Viewer3DConfigData {
  id: string;
  updatedAt: Date | string;

  // Camera
  cameraInitialDistance: number;
  cameraFov: number;
  cameraMinDistance: number;
  cameraMaxDistance: number;

  // Rotazione libera 360°
  cameraFreeRotation: boolean;

  // Rotazione (in gradi)
  rotationMinPolarAngle: number;
  rotationMaxPolarAngle: number;

  // Auto-rotation
  autoRotateEnabled: boolean;
  autoRotateSpeed: number;
  autoRotateResumeDelay: number;

  // Controlli
  controlsEnablePan: boolean;
  controlsEnablePanHorizontal: boolean;
  controlsEnablePanVertical: boolean;
  controlsRotateSpeed: number;
  controlsZoomSpeed: number;
  controlsPanSpeed: number;
  controlsEnableDamping: boolean;
  controlsDampingFactor: number;

  // Modello
  modelTargetSize: number;

  // Illuminazione
  lightingAmbientIntensity: number;
  lightingMainLightPositionX: number;
  lightingMainLightPositionY: number;
  lightingMainLightPositionZ: number;
  lightingMainLightIntensity: number;
  lightingSecondaryLightPositionX: number;
  lightingSecondaryLightPositionY: number;
  lightingSecondaryLightPositionZ: number;
  lightingSecondaryLightIntensity: number;

  // Ombre
  shadowsEnabled: boolean;
  shadowsPositionX: number;
  shadowsPositionY: number;
  shadowsPositionZ: number;
  shadowsOpacity: number;
  shadowsScale: number;
  shadowsBlur: number;
  shadowsFar: number;
  shadowsResolution: number;

  // Effetti
  effectsEnabled: boolean;
  effectsEnvMapIntensity: number;
  effectsRoughness: number;
  effectsMetalness: number;
  effectsToneMappingWhitePoint: number;
  effectsToneMappingMiddleGrey: number;
  effectsVignetteOffset: number;
  effectsVignetteDarkness: number;

  // Background
  backgroundColor: string;
}

// Configurazione di default (corrisponde ai valori nel file config)
export const defaultViewer3DConfig: Viewer3DConfigData = {
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

// Context
interface Viewer3DConfigContextType {
  config: Viewer3DConfigData;
  loading: boolean;
  refetch: () => Promise<void>;
}

const Viewer3DConfigContext = createContext<Viewer3DConfigContextType>({
  config: defaultViewer3DConfig,
  loading: true,
  refetch: async () => {},
});

// Hook per usare il context
export function useViewer3DConfig() {
  return useContext(Viewer3DConfigContext);
}

// Provider
interface Viewer3DConfigProviderProps {
  children: ReactNode;
}

export function Viewer3DConfigProvider({ children }: Viewer3DConfigProviderProps) {
  const [config, setConfig] = useState<Viewer3DConfigData>(defaultViewer3DConfig);
  const [loading, setLoading] = useState(true);

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/viewer3d-config');
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching viewer3d config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  return (
    <Viewer3DConfigContext.Provider value={{ config, loading, refetch: fetchConfig }}>
      {children}
    </Viewer3DConfigContext.Provider>
  );
}

// Hook per ottenere la configurazione con conversione automatica
export function useViewerConfig() {
  const { config, loading, refetch } = useViewer3DConfig();

  // Converte la configurazione dal formato DB al formato usato internamente
  const convertedConfig = {
    camera: {
      initialDistance: config.cameraInitialDistance,
      fov: config.cameraFov,
      minDistance: config.cameraMinDistance,
      maxDistance: config.cameraMaxDistance,
    },
    rotation: {
      freeRotation: config.cameraFreeRotation,
      minPolarAngle: (config.rotationMinPolarAngle * Math.PI) / 180, // Converti in radianti
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
    model: {
      targetSize: config.modelTargetSize,
    },
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
      fillLights: [] as { position: [number, number, number]; intensity: number }[],
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
  };

  return { config: convertedConfig, rawConfig: config, loading, refetch };
}
