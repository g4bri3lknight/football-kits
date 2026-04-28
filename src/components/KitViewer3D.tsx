'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, SMAA, ToneMapping, Vignette, Bloom, N8AO, BrightnessContrast, HueSaturation, ChromaticAberration, DepthOfField, TiltShift2, Noise, DotScreen, Pixelation, Scanline, Glitch } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Shirt, Maximize2, Minimize2, RotateCw, HelpCircle, MousePointer2, Move, ZoomIn, RotateCcw, AlertTriangle, Loader2, X } from 'lucide-react';
import { KIT_VIEWER_CONFIG } from '@/config/kit-viewer.config';
import { FramerDialog, DialogPrimitive } from '@/components/ui/framer-dialog';
import { staggerContainer, staggerItem } from '@/components/ui/animated-dialog';
import { motion } from 'framer-motion';
import { useViewerConfig } from '@/hooks/useViewer3DConfig';

// Fallback config per quando il context non è disponibile
const FALLBACK_CONFIG: ConvertedConfig = {
  camera: {
    initialDistance: KIT_VIEWER_CONFIG.camera.initialDistance,
    fov: KIT_VIEWER_CONFIG.camera.fov,
    minDistance: KIT_VIEWER_CONFIG.camera.minDistance,
    maxDistance: KIT_VIEWER_CONFIG.camera.maxDistance,
  },
  rotation: {
    freeRotation: false,
    minPolarAngle: KIT_VIEWER_CONFIG.rotation.minPolarAngle,
    maxPolarAngle: KIT_VIEWER_CONFIG.rotation.maxPolarAngle,
  },
  autoRotate: KIT_VIEWER_CONFIG.autoRotate as ConvertedConfig['autoRotate'],
  controls: KIT_VIEWER_CONFIG.controls as ConvertedConfig['controls'],
  model: KIT_VIEWER_CONFIG.model as ConvertedConfig['model'],
  lighting: {
    ambientIntensity: KIT_VIEWER_CONFIG.lighting.ambientIntensity,
    mainLight: {
      position: KIT_VIEWER_CONFIG.lighting.mainLight.position as [number, number, number],
      intensity: KIT_VIEWER_CONFIG.lighting.mainLight.intensity,
    },
    secondaryLight: {
      position: KIT_VIEWER_CONFIG.lighting.secondaryLight.position as [number, number, number],
      intensity: KIT_VIEWER_CONFIG.lighting.secondaryLight.intensity,
    },
    fillLights: KIT_VIEWER_CONFIG.lighting.fillLights.map(l => ({
      position: l.position as [number, number, number],
      intensity: l.intensity,
    })),
  },
  shadows: {
    enabled: true,
    position: KIT_VIEWER_CONFIG.shadows.position as [number, number, number],
    opacity: KIT_VIEWER_CONFIG.shadows.opacity,
    scale: KIT_VIEWER_CONFIG.shadows.scale,
    blur: KIT_VIEWER_CONFIG.shadows.blur,
    far: KIT_VIEWER_CONFIG.shadows.far,
    resolution: KIT_VIEWER_CONFIG.shadows.resolution,
  },
  effects: {
    enabled: true,
    envMapIntensity: 1.5,
    roughness: 0.4,
    metalness: 0.1,
    toneMappingWhitePoint: 4.0,
    toneMappingMiddleGrey: 0.6,
    vignetteOffset: 0.3,
    vignetteDarkness: 0.5,
  },
  bloom: {
    enabled: false,
    intensity: 0.5,
    luminanceThreshold: 0.9,
    luminanceSmoothing: 0.025,
  },
  ao: {
    enabled: false,
    intensity: 2.0,
    distance: 0.2,
    falloff: 0.01,
  },
  brightnessContrast: {
    enabled: false,
    brightness: 0,
    contrast: 0,
  },
  hueSaturation: {
    enabled: false,
    hue: 0,
    saturation: 0,
  },
  chromaticAberration: { enabled: false, offset: 0.002 },
  depthOfField: { enabled: false, focusDistance: 0.01, focalLength: 0.02, bokehScale: 3 },
  tiltShift: { enabled: false, blur: 0.05, start: 0.49, end: 0.5 },
  noise: { enabled: false, opacity: 0.05 },
  dotScreen: { enabled: false, angle: 1.39, scale: 1 },
  pixelation: { enabled: false, granularity: 5 },
  scanline: { enabled: false, density: 1.5, opacity: 0.1 },
  glitch: { enabled: false, delay: 3, duration: 0.6, strength: 0.3 },
  backgroundColor: '#1a1a1a',
};

// Tipo per la configurazione convertita
interface ConvertedConfig {
  camera: {
    initialDistance: number;
    fov: number;
    minDistance: number;
    maxDistance: number;
  };
  rotation: {
    freeRotation: boolean;
    minPolarAngle: number;
    maxPolarAngle: number;
  };
  autoRotate: {
    enabled: boolean;
    speed: number;
    resumeDelay: number;
  };
  controls: {
    enablePan: boolean;
    enablePanHorizontal: boolean;
    enablePanVertical: boolean;
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    enableDamping: boolean;
    dampingFactor: number;
    maxPanHorizontal: number;
    maxPanVertical: number;
  };
  model: {
    targetSize: number;
  };
  lighting: {
    ambientIntensity: number;
    mainLight: {
      position: [number, number, number];
      intensity: number;
    };
    secondaryLight: {
      position: [number, number, number];
      intensity: number;
    };
    fillLights: { position: [number, number, number]; intensity: number }[];
  };
  shadows: {
    enabled: boolean;
    position: [number, number, number];
    opacity: number;
    scale: number;
    blur: number;
    far: number;
    resolution: number;
  };
  effects: {
    enabled: boolean;
    envMapIntensity: number;
    roughness: number;
    metalness: number;
    toneMappingWhitePoint: number;
    toneMappingMiddleGrey: number;
    vignetteOffset: number;
    vignetteDarkness: number;
  };
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

interface KitViewer3DProps {
  modelUrl?: string;
  className?: string;
  config?: ConvertedConfig; // Config opzionale passata esternamente
}

type ModelState = 'checking' | 'loading' | 'ready' | 'not_found';

// Shared help content for both normal and fullscreen modes
function HelpDialogContent() {
  return (
    <div className="space-y-3">
      <p className="text-base font-semibold mb-4">Controlli 3D</p>

      {/* Rotazione */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
          <MousePointer2 className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">Rotazione</p>
          <p className="text-muted-foreground text-xs">Click sinistro + trascina</p>
        </div>
      </div>

      {/* Zoom */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
          <ZoomIn className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">Zoom</p>
          <p className="text-muted-foreground text-xs">Scroll del mouse o pinch</p>
        </div>
      </div>

      {/* Pan */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
          <Move className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">Pan</p>
          <p className="text-muted-foreground text-xs">Click destro + trascina</p>
        </div>
      </div>

      {/* Reset Camera */}
      <div className="flex items-start gap-3">
        <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
          <RotateCcw className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-medium text-sm">Reset camera</p>
          <p className="text-muted-foreground text-xs">Doppio click sul modello</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t my-4" />

      {/* Legenda pulsanti */}
      <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3">Pulsanti</p>

      <div className="flex items-center gap-2.5 py-1">
        <RotateCw className="w-5 h-5 text-green-500 shrink-0" />
        <span className="text-sm">Attiva/disattiva rotazione automatica</span>
      </div>

      <div className="flex items-center gap-2.5 py-1">
        <Maximize2 className="w-5 h-5 text-foreground shrink-0" />
        <span className="text-sm">Modalità schermo intero</span>
      </div>
    </div>
  );
}

// Componente Modello con Material Enhancement
function Model({
  url,
  effectsEnabled,
  targetSize,
  envMapIntensity,
  roughness,
  metalness
}: {
  url: string;
  effectsEnabled: boolean;
  targetSize: number;
  envMapIntensity: number;
  roughness: number;
  metalness: number;
}) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  // Salva i valori originali dei materiali per poterli ripristinare
  const originalMaterialsRef = useRef<Map<number, {
    envMapIntensity: number;
    roughness: number;
    metalness: number;
    color: THREE.Color;
  }>>(new Map());

  // Contatore per ID univoci per materiali senza .id
  const materialIdCounter = useRef(0);

  // Store the scene URL to track changes
  const prevSceneUrlRef = useRef<string>('');

  useEffect(() => {
    if (!groupRef.current) return;

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = targetSize / maxDimension;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );
  }, [scene, targetSize]);

  // Reset original materials cache when scene changes
  useEffect(() => {
    if (url !== prevSceneUrlRef.current) {
      prevSceneUrlRef.current = url;
      originalMaterialsRef.current.clear();
      materialIdCounter.current = 0;
    }
  }, [url]);

  // Material Enhancement - applica e ripristina i materiali in base agli effetti
  useEffect(() => {
    if (effectsEnabled) {
      // Applica gli effetti ai materiali — sovrascrive sempre i valori
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;

          if (material && material.isMeshStandardMaterial) {
            const materialId = (material as any).id ?? materialIdCounter.current++;

            // Salva i valori originali solo la prima volta
            if (!originalMaterialsRef.current.has(materialId)) {
              originalMaterialsRef.current.set(materialId, {
                envMapIntensity: material.envMapIntensity,
                roughness: material.roughness ?? 0.5,
                metalness: material.metalness ?? 0,
                color: material.color ? material.color.clone() : new THREE.Color(),
              });
            }

            // Applica sempre envMapIntensity (serve per riflettere l'ambiente HDR)
            material.envMapIntensity = envMapIntensity;

            // Applica sempre roughness e metalness dai controlli
            material.roughness = roughness;
            material.metalness = metalness;

            // Migliora il contrasto dei colori
            if (material.color) {
              material.color.convertSRGBToLinear();
            }

            // Abilita tonemapping sui materiali
            material.toneMapped = true;

            // Forza l'aggiornamento
            material.needsUpdate = true;
          }
        }
      });
    } else {
      // Ripristina i valori originali dei materiali
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          const material = child.material as THREE.MeshStandardMaterial;

          if (material && material.isMeshStandardMaterial) {
            const materialId = (material as any).id ?? 0;
            const original = originalMaterialsRef.current.get(materialId);
            if (original) {
              material.envMapIntensity = original.envMapIntensity;
              material.roughness = original.roughness;
              material.metalness = original.metalness;
              if (material.color && original.color) {
                material.color.copy(original.color);
              }
              material.needsUpdate = true;
            }
          }
        }
      });
    }
  }, [scene, effectsEnabled, envMapIntensity, roughness, metalness]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// Componente controlli camera
function CameraController({
  resetKey,
  autoRotate,
  onResumeAutoRotate,
  onPauseAutoRotate,
  config,
}: {
  resetKey: number;
  autoRotate: boolean;
  onResumeAutoRotate: () => void;
  onPauseAutoRotate: () => void;
  config: ConvertedConfig;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const initialTarget = useRef(new THREE.Vector3(0, 0, 0));
  const panOffset = useRef(new THREE.Vector2(0, 0));
  const isPanning = useRef(false);
  const lastMousePos = useRef(new THREE.Vector2(0, 0));

  // Pan personalizzato sempre attivo per applicare i limiti maxPan
  const useCustomPan = true;

  // Inizializza camera e controlli — si attiva al mount, al reset (double-click)
  // e quando cambiano distanza/fov dal pannello admin.
  // NOTA: NON usiamo controlsRef.current.reset() perché ripristinerebbe
  // la posizione salvata al mount ignorando il nuovo config.camera.initialDistance.
  useEffect(() => {
    const perspCamera = camera as THREE.PerspectiveCamera;
    perspCamera.position.set(0, 0, config.camera.initialDistance);
    perspCamera.fov = config.camera.fov;
    perspCamera.lookAt(0, 0, 0);
    perspCamera.updateProjectionMatrix();
    if (controlsRef.current) {
      // Sincronizza OrbitControls sulla nuova posizione della camera
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
      initialTarget.current.set(0, 0, 0);
      panOffset.current.set(0, 0);
    }
  }, [camera, resetKey, config.camera.initialDistance, config.camera.fov]);

  // Aggiorna autoRotate e autoRotateSpeed dinamicamente
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = config.autoRotate.speed;
    }
  }, [autoRotate, config.autoRotate.speed]);

  // Aggiorna dinamicamente tutti i limiti di OrbitControls (zoom, rotazione, damping)
  useEffect(() => {
    if (!controlsRef.current) return;
    const controls = controlsRef.current;

    controls.minDistance = config.camera.minDistance;
    controls.maxDistance = config.camera.maxDistance;
    controls.minPolarAngle = config.rotation.freeRotation ? 0 : config.rotation.minPolarAngle;
    controls.maxPolarAngle = config.rotation.freeRotation ? Math.PI : config.rotation.maxPolarAngle;
    controls.rotateSpeed = config.controls.rotateSpeed;
    controls.zoomSpeed = config.controls.zoomSpeed;
    controls.panSpeed = config.controls.panSpeed;
    controls.enableDamping = config.controls.enableDamping;
    controls.dampingFactor = config.controls.dampingFactor;
    controls.update();
  }, [
    config.camera.minDistance,
    config.camera.maxDistance,
    config.rotation.freeRotation,
    config.rotation.minPolarAngle,
    config.rotation.maxPolarAngle,
    config.controls.rotateSpeed,
    config.controls.zoomSpeed,
    config.controls.panSpeed,
    config.controls.enableDamping,
    config.controls.dampingFactor,
  ]);

  // Gestisci eventi drag di OrbitControls (rotazione e zoom)
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;

    const handleStart = () => {
      if (!isPanning.current) {
        onPauseAutoRotate();
      }
    };
    const handleEnd = () => {
      if (!isPanning.current) {
        onResumeAutoRotate();
      }
    };

    controls.addEventListener('start', handleStart);
    controls.addEventListener('end', handleEnd);

    return () => {
      controls.removeEventListener('start', handleStart);
      controls.removeEventListener('end', handleEnd);
    };
  }, [onPauseAutoRotate, onResumeAutoRotate]);

  // Gestione pan personalizzata con tasto destro
  useEffect(() => {
    if (!useCustomPan) return;

    const canvas = gl.domElement;

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 2 || e.button === 1) { // Tasto destro o centrale
        isPanning.current = true;
        lastMousePos.current.set(e.clientX, e.clientY);
        onPauseAutoRotate();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isPanning.current || !controlsRef.current) return;

      const deltaX = e.clientX - lastMousePos.current.x;
      const deltaY = e.clientY - lastMousePos.current.y;
      lastMousePos.current.set(e.clientX, e.clientY);

      // La velocità del pan è proporzionale alla distanza della camera,
      // così il pan si comporta in modo consistente a qualsiasi livello di zoom
      const cameraDistance = camera.position.distanceTo(controlsRef.current.target);
      const baseSpeed = config.controls.panSpeed * 0.003 * cameraDistance;

      if (config.controls.enablePanHorizontal) {
        panOffset.current.x -= deltaX * baseSpeed;
        panOffset.current.x = Math.max(-config.controls.maxPanHorizontal, Math.min(config.controls.maxPanHorizontal, panOffset.current.x));
      }
      if (config.controls.enablePanVertical) {
        panOffset.current.y += deltaY * baseSpeed;
        panOffset.current.y = Math.max(-config.controls.maxPanVertical, Math.min(config.controls.maxPanVertical, panOffset.current.y));
      }

      const target = controlsRef.current.target;
      target.x = initialTarget.current.x + panOffset.current.x;
      target.y = initialTarget.current.y + panOffset.current.y;
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isPanning.current && (e.button === 2 || e.button === 1)) {
        isPanning.current = false;
        onResumeAutoRotate();
      }
    };

    const handleMouseLeave = () => {
      if (isPanning.current) {
        isPanning.current = false;
        onResumeAutoRotate();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('contextmenu', handleContextMenu);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [gl, useCustomPan, onPauseAutoRotate, onResumeAutoRotate, config.controls.panSpeed, config.controls.enablePanHorizontal, config.controls.enablePanVertical, config.controls.maxPanHorizontal, config.controls.maxPanVertical]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      rotateSpeed={config.controls.rotateSpeed}
      zoomSpeed={config.controls.zoomSpeed}
      panSpeed={config.controls.panSpeed}
      enableDamping={config.controls.enableDamping}
      dampingFactor={config.controls.dampingFactor}
      autoRotate={autoRotate}
      autoRotateSpeed={config.autoRotate.speed}
    />
  );
}

// Componente controller luci — aggiorna imperativamente le proprietà delle luci
// perché R3F non sempre aggiorna reattivamente i props dei componenti light.
function LightController({ config }: { config: ConvertedConfig }) {
  const ambientRef = useRef<THREE.AmbientLight>(null!);
  const mainLightRef = useRef<THREE.DirectionalLight>(null!);
  const secondaryLightRef = useRef<THREE.DirectionalLight>(null!);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.intensity = config.lighting.ambientIntensity;
    }
  }, [config.lighting.ambientIntensity]);

  useEffect(() => {
    if (mainLightRef.current) {
      mainLightRef.current.position.set(...config.lighting.mainLight.position);
      mainLightRef.current.intensity = config.lighting.mainLight.intensity;
    }
  }, [config.lighting.mainLight.position, config.lighting.mainLight.intensity]);

  useEffect(() => {
    if (secondaryLightRef.current) {
      secondaryLightRef.current.position.set(...config.lighting.secondaryLight.position);
      secondaryLightRef.current.intensity = config.lighting.secondaryLight.intensity;
    }
  }, [config.lighting.secondaryLight.position, config.lighting.secondaryLight.intensity]);

  return (
    <>
      <ambientLight ref={ambientRef} intensity={config.lighting.ambientIntensity} />
      <directionalLight
        ref={mainLightRef}
        position={config.lighting.mainLight.position}
        intensity={config.lighting.mainLight.intensity}
        castShadow
      />
      <directionalLight
        ref={secondaryLightRef}
        position={config.lighting.secondaryLight.position}
        intensity={config.lighting.secondaryLight.intensity}
      />
    </>
  );
}

// Scene
function Scene({
  modelUrl,
  resetKey,
  autoRotate,
  onResumeAutoRotate,
  onPauseAutoRotate,
  config,
}: {
  modelUrl: string;
  resetKey: number;
  autoRotate: boolean;
  onResumeAutoRotate: () => void;
  onPauseAutoRotate: () => void;
  config: ConvertedConfig;
}) {
  const effectsEnabled = config.effects.enabled;

  // Ref per accedere all'EffectComposer e aggiornare gli effetti senza
  // usare refs su ToneMapping/Vignette (che hanno reference circolari).
  const composerRef = useRef<any>(null);

  // Aggiorna ToneMapping e Vignette uniforms imperativamente traversando
  // gli effetti dentro l'EffectComposer (evita JSON.stringify circolare)
  useEffect(() => {
    if (!composerRef.current || !effectsEnabled) return;
    try {
      const effects = composerRef.current.effects || [];
      for (const effect of effects) {
        // ToneMapping
        if (effect.uniforms?.has?.('whitePoint')) {
          effect.uniforms.get('whitePoint').value = config.effects.toneMappingWhitePoint;
          effect.uniforms.get('middleGrey').value = config.effects.toneMappingMiddleGrey;
        }
        // Vignette
        if (effect.uniforms?.has?.('offset')) {
          effect.uniforms.get('offset').value = config.effects.vignetteOffset;
          effect.uniforms.get('darkness').value = config.effects.vignetteDarkness;
        }
        // BrightnessContrast
        if (effect.uniforms?.has?.('brightness')) {
          effect.uniforms.get('brightness').value = config.brightnessContrast.brightness;
          effect.uniforms.get('contrast').value = config.brightnessContrast.contrast;
        }
        // HueSaturation
        if (effect.uniforms?.has?.('hue')) {
          effect.uniforms.get('hue').value = config.hueSaturation.hue;
          effect.uniforms.get('saturation').value = config.hueSaturation.saturation;
        }
        // ChromaticAberration
        if (effect.uniforms?.has?.('offset') && effect.uniforms.get('offset').value?.isVector2) {
          effect.uniforms.get('offset').value.set(config.chromaticAberration.offset, config.chromaticAberration.offset);
        }
      }
    } catch {
      // gli effetti potrebbero non essere pronti
    }
  }, [
    effectsEnabled,
    config.effects.toneMappingWhitePoint,
    config.effects.toneMappingMiddleGrey,
    config.effects.vignetteOffset,
    config.effects.vignetteDarkness,
    config.brightnessContrast.brightness,
    config.brightnessContrast.contrast,
    config.hueSaturation.hue,
    config.hueSaturation.saturation,
    config.chromaticAberration.offset,
  ]);

  return (
    <>
      {/* HDR Environment per riflessi realistici - solo se effetti attivi */}
      {effectsEnabled && <Environment preset="studio" background={false} />}

      {/* Luci con aggiornamento imperativo via LightController */}
      <LightController config={config} />

      {config.lighting.fillLights.map((light, i) => (
        <pointLight key={i} position={light.position} intensity={light.intensity} />
      ))}

      <group>
        <Suspense fallback={null}>
          <Model
            url={modelUrl}
            effectsEnabled={effectsEnabled}
            targetSize={config.model.targetSize}
            envMapIntensity={config.effects.envMapIntensity}
            roughness={config.effects.roughness}
            metalness={config.effects.metalness}
          />
        </Suspense>
      </group>

      {/* Contact Shadows - indipendente dagli effetti */}
      {config.shadows.enabled && (
        <ContactShadows
          key={`${config.shadows.opacity}-${config.shadows.scale}-${config.shadows.blur}-${config.shadows.far}-${config.shadows.resolution}`}
          position={config.shadows.position}
          opacity={config.shadows.opacity}
          scale={config.shadows.scale}
          blur={config.shadows.blur}
          far={config.shadows.far}
          resolution={config.shadows.resolution}
        />
      )}

      <CameraController
        resetKey={resetKey}
        autoRotate={autoRotate}
        onResumeAutoRotate={onResumeAutoRotate}
        onPauseAutoRotate={onPauseAutoRotate}
        config={config}
      />

      {/* Post-processing effects - solo se effetti abilitati (ombre sono indipendenti) */}
      {effectsEnabled && (
        <EffectComposer ref={composerRef} multisampling={0}>
          {/* Tutti gli effetti in un unico array ReactElement per compatibilità con EffectComposer children */}
          {(() => {
            const fx: React.ReactElement[] = [];
            // Anti-aliasing sempre attivo
            fx.push(<SMAA key="smaa" />);
            // Tone Mapping sempre attivo
            fx.push(<ToneMapping key="tm" mode={THREE.ACESFilmicToneMapping} resolution={256} whitePoint={config.effects.toneMappingWhitePoint} middleGrey={config.effects.toneMappingMiddleGrey} minLuminance={0.01} averageLuminance={1.0} />);
            // Vignette sempre attiva
            fx.push(<Vignette key="vig" offset={config.effects.vignetteOffset} darkness={config.effects.vignetteDarkness} />);
            // Effetti opzionali
            if (config.bloom.enabled) fx.push(<Bloom key="bloom" intensity={config.bloom.intensity} luminanceThreshold={config.bloom.luminanceThreshold} luminanceSmoothing={config.bloom.luminanceSmoothing} mipmapBlur />);
            if (config.ao.enabled) fx.push(<N8AO key="ao" intensity={config.ao.intensity} aoRadius={config.ao.distance} distanceFalloff={config.ao.falloff} />);
            if (config.brightnessContrast.enabled) fx.push(<BrightnessContrast key="bc" brightness={config.brightnessContrast.brightness} contrast={config.brightnessContrast.contrast} />);
            if (config.hueSaturation.enabled) fx.push(<HueSaturation key="hs" hue={config.hueSaturation.hue} saturation={config.hueSaturation.saturation} />);
            if (config.chromaticAberration.enabled) fx.push(<ChromaticAberration key="ca" offset={new THREE.Vector2(config.chromaticAberration.offset, config.chromaticAberration.offset)} radialModulation={false} modulationOffset={0} />);
            if (config.depthOfField.enabled) fx.push(<DepthOfField key="dof" focusDistance={config.depthOfField.focusDistance} focalLength={config.depthOfField.focalLength} bokehScale={config.depthOfField.bokehScale} />);
            if (config.tiltShift.enabled) fx.push(<TiltShift2 key="ts" blur={config.tiltShift.blur} start={[config.tiltShift.start, config.tiltShift.start]} end={[config.tiltShift.end, config.tiltShift.end]} />);
            if (config.noise.enabled) fx.push(<Noise key="noise" opacity={config.noise.opacity} />);
            if (config.dotScreen.enabled) fx.push(<DotScreen key="dot" angle={config.dotScreen.angle} scale={config.dotScreen.scale} />);
            if (config.pixelation.enabled) fx.push(<Pixelation key="pixel" granularity={config.pixelation.granularity} />);
            if (config.scanline.enabled) fx.push(<Scanline key="scan" density={config.scanline.density} opacity={config.scanline.opacity} />);
            if (config.glitch.enabled) fx.push(<Glitch key="glitch" delay={new THREE.Vector2(config.glitch.delay, config.glitch.delay)} duration={new THREE.Vector2(config.glitch.duration, config.glitch.duration)} strength={new THREE.Vector2(config.glitch.strength, config.glitch.strength)} />);
            return fx;
          })()}
        </EffectComposer>
      )}
    </>
  );
}

export default function KitViewer3D({
  modelUrl,
  className = '',
  config: externalConfig,
}: KitViewer3DProps) {
  // Prova a usare il context, ma fallback se non disponibile
  let contextConfig: ConvertedConfig | null = null;
  let contextLoading = false;

  try {
    const context = useViewerConfig();
    contextConfig = context.config;
    contextLoading = context.loading;
  } catch {
    // Context non disponibile, usa fallback
  }

  // Usa config esterna > context > fallback
  const config = externalConfig || contextConfig || FALLBACK_CONFIG;

  const [resetKey, setResetKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(config.autoRotate.enabled);
  const [autoRotate, setAutoRotate] = useState<boolean>(config.autoRotate.enabled);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [modelState, setModelState] = useState<ModelState>('checking');
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Verifica se il modello esiste
  useEffect(() => {
    if (!modelUrl) {
      setModelState('checking');
      return;
    }

    setModelState('checking');

    fetch(modelUrl, { method: 'HEAD' })
      .then(response => {
        if (response.ok) {
          setModelState('ready');
        } else {
          setModelState('not_found');
        }
      })
      .catch(() => {
        setModelState('not_found');
      });
  }, [modelUrl]);

  const pauseAutoRotate = useCallback(() => {
    isInteractingRef.current = true;
    setIsDragging(true);
    setAutoRotate(false);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  }, []);

  const resumeAutoRotate = useCallback(() => {
    isInteractingRef.current = false;
    setIsDragging(false);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    resumeTimeoutRef.current = setTimeout(() => {
      if (!isInteractingRef.current && autoRotateEnabled) {
        setAutoRotate(true);
      }
      resumeTimeoutRef.current = null;
    }, config.autoRotate.resumeDelay);
  }, [autoRotateEnabled, config.autoRotate.resumeDelay]);

  const toggleAutoRotate = () => {
    const newValue = !autoRotateEnabled;
    setAutoRotateEnabled(newValue);
    setAutoRotate(newValue);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Errore fullscreen:', err);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Forza resize quando il modello è pronto (per calcolare correttamente le dimensioni del canvas)
  useEffect(() => {
    if (modelState === 'ready') {
      // Piccolo delay per assicurarsi che il DOM sia aggiornato
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [modelState]);

  // Aggiorna autoRotateEnabled quando la config cambia
  useEffect(() => {
    setAutoRotateEnabled(config.autoRotate.enabled);
    setAutoRotate(config.autoRotate.enabled);
  }, [config.autoRotate.enabled]);

  // Nessun modello
  if (!modelUrl) {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <Shirt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">Nessun modello presente</p>
        </div>
      </div>
    );
  }

  // Loader durante la verifica
  if (modelState === 'checking') {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Errore - modello non trovato
  if (modelState === 'not_found') {
    return (
      <div className={`w-full h-full flex items-center justify-center ${className}`}>
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-amber-500/50 mx-auto mb-4" />
          <p className="text-muted-foreground font-medium mb-2">Modello 3D non disponibile</p>
          <p className="text-muted-foreground/60 text-sm">Il modello 3D per questo kit non è stato trovato.</p>
        </div>
      </div>
    );
  }

  // Modello pronto - mostra Canvas
  return (
    <div
      ref={containerRef}
      className={`w-full h-full relative ${className}`}
      style={{
        backgroundColor: isFullscreen ? config.backgroundColor : undefined,
        cursor: isDragging ? 'none' : 'grab',
      }}
      onDoubleClick={() => setResetKey(k => k + 1)}
    >
      <Canvas
        key={modelUrl}
        camera={{
          position: [0, 0, config.camera.initialDistance],
          fov: config.camera.fov
        }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <Scene
          modelUrl={modelUrl}
          resetKey={resetKey}
          autoRotate={autoRotate}
          onResumeAutoRotate={resumeAutoRotate}
          onPauseAutoRotate={pauseAutoRotate}
          config={config}
        />
      </Canvas>

      {/* Controls Buttons */}
      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
        {/* Toggle Auto-Rotate Button */}
        <button
          onClick={toggleAutoRotate}
          className="p-2 rounded-lg backdrop-blur-md bg-black/50 border border-white/20 hover:bg-black/70 transition-colors"
          title={autoRotateEnabled ? 'Disattiva rotazione automatica' : 'Attiva rotazione automatica'}
        >
          <RotateCw
            className={`w-5 h-5 transition-colors ${autoRotateEnabled ? 'text-green-400' : 'text-white/50'}`}
          />
        </button>

        {/* Fullscreen Button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-lg backdrop-blur-md bg-black/50 border border-white/20 hover:bg-black/70 transition-colors"
          title={isFullscreen ? 'Esci da schermo intero' : 'Schermo intero'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-5 h-5 text-white" />
          ) : (
            <Maximize2 className="w-5 h-5 text-white" />
          )}
        </button>

        {/* Help Button */}
        <button
          onClick={() => setShowHelp(true)}
          className="p-2 rounded-lg backdrop-blur-md bg-black/50 border border-white/20 hover:bg-black/70 transition-colors"
          title='Controlli'
        >
          <HelpCircle className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Help Dialog - Normal mode (uses Portal) */}
      {!isFullscreen && (
        <FramerDialog
          open={showHelp}
          onOpenChange={setShowHelp}
          className="max-w-sm w-[calc(100%-2rem)] max-h-[85vh] overflow-y-auto"
        >
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="space-y-3"
          >
            <DialogPrimitive.Title className="text-lg sm:text-xl font-semibold mb-4">Controlli 3D</DialogPrimitive.Title>

            <HelpDialogContent />
          </motion.div>
        </FramerDialog>
      )}

      {/* Help Panel - Fullscreen mode (inline, no portal) */}
      {isFullscreen && showHelp && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30, mass: 0.8 }}
          className="absolute bottom-16 right-3 z-20 w-72 max-w-[calc(100vw-2rem)] rounded-xl border-2 bg-background/95 backdrop-blur-md p-5 shadow-2xl"
          style={{ borderColor: '#002f42' }}
        >
          <button
            onClick={() => setShowHelp(false)}
            className="absolute top-3 right-3 p-1 rounded-md bg-black/30 hover:bg-black/50 transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <HelpDialogContent />
        </motion.div>
      )}
    </div>
  );
}
