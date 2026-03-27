'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows, Environment } from '@react-three/drei';
import { EffectComposer, SMAA, ToneMapping, Vignette } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Suspense, useEffect, useRef, useState, useMemo } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Shirt, Sparkles, Maximize2, Minimize2, RotateCw, HelpCircle, MousePointer2, Move, ZoomIn, RotateCcw, AlertTriangle, Loader2 } from 'lucide-react';
import { KIT_VIEWER_CONFIG } from '@/config/kit-viewer.config';
import { FramerDialog, DialogPrimitive } from '@/components/ui/framer-dialog';
import { staggerContainer, staggerItem } from '@/components/ui/animated-dialog';
import { motion } from 'framer-motion';

const CFG = KIT_VIEWER_CONFIG;

interface KitViewer3DProps {
  modelUrl?: string;
  className?: string;
}

type ModelState = 'checking' | 'loading' | 'ready' | 'not_found';

// Componente Modello con Material Enhancement
function Model({ url, effectsEnabled }: { url: string; effectsEnabled: boolean }) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = CFG.model.targetSize / maxDimension;

    groupRef.current.scale.setScalar(scale);
    groupRef.current.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );
  }, [scene]);

  // Material Enhancement - migliora i materiali del modello (solo se effetti attivi)
  useEffect(() => {
    if (!effectsEnabled) return;
    
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        
        if (material && material.isMeshStandardMaterial) {
          // Migliora la risposta all'ambiente HDR
          material.envMapIntensity = 1.5;
          
          // Imposta roughness se non definita (materiali semi-lucidi)
          if (material.roughness === undefined || material.roughness === 1) {
            material.roughness = 0.4;
          }
          
          // Imposta metalness per materiali che sembrano metallici
          if (material.metalness === undefined) {
            material.metalness = 0.1;
          }
          
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
  }, [scene, effectsEnabled]);

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
}: { 
  resetKey: number;
  autoRotate: boolean;
  onResumeAutoRotate: () => void;
  onPauseAutoRotate: () => void;
}) {
  const { camera, gl } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const initialTarget = useRef(new THREE.Vector3(0, 0, 0));
  const panOffset = useRef(new THREE.Vector2(0, 0));
  const isPanning = useRef(false);
  const lastMousePos = useRef(new THREE.Vector2(0, 0));

  // Pan personalizzato se uno degli assi è disabilitato
  const useCustomPan = !CFG.controls.enablePanHorizontal || !CFG.controls.enablePanVertical;

  useEffect(() => {
    camera.position.set(0, 0, CFG.camera.initialDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.reset();
      initialTarget.current.copy(controlsRef.current.target);
    }
  }, [camera, resetKey]);

  // Aggiorna autoRotate dinamicamente
  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
    }
  }, [autoRotate]);

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

      const speed = CFG.controls.panSpeed * 0.01;
      
      if (CFG.controls.enablePanHorizontal) {
        panOffset.current.x -= deltaX * speed;
      }
      if (CFG.controls.enablePanVertical) {
        panOffset.current.y += deltaY * speed;
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
  }, [gl, useCustomPan, onPauseAutoRotate, onResumeAutoRotate]);

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={useCustomPan ? false : CFG.controls.enablePan}
      minDistance={CFG.camera.minDistance}
      maxDistance={CFG.camera.maxDistance}
      minPolarAngle={CFG.rotation.minPolarAngle}
      maxPolarAngle={CFG.rotation.maxPolarAngle}
      rotateSpeed={CFG.controls.rotateSpeed}
      zoomSpeed={CFG.controls.zoomSpeed}
      panSpeed={CFG.controls.panSpeed}
      enableDamping={CFG.controls.enableDamping}
      dampingFactor={CFG.controls.dampingFactor}
      autoRotate={autoRotate}
      autoRotateSpeed={CFG.autoRotate.speed}
    />
  );
}

// Scene
function Scene({ 
  modelUrl, 
  resetKey,
  autoRotate,
  onResumeAutoRotate,
  onPauseAutoRotate,
  effectsEnabled,
}: { 
  modelUrl: string; 
  resetKey: number;
  autoRotate: boolean;
  onResumeAutoRotate: () => void;
  onPauseAutoRotate: () => void;
  effectsEnabled: boolean;
}) {
  return (
    <>
      {/* HDR Environment per riflessi realistici - solo se effetti attivi */}
      {effectsEnabled && <Environment preset="studio" background={false} />}
      
      <ambientLight intensity={CFG.lighting.ambientIntensity} />
      <directionalLight
        position={CFG.lighting.mainLight.position as [number, number, number]}
        intensity={CFG.lighting.mainLight.intensity}
        castShadow
      />
      <directionalLight
        position={CFG.lighting.secondaryLight.position as [number, number, number]}
        intensity={CFG.lighting.secondaryLight.intensity}
      />
      {CFG.lighting.fillLights.map((light, i) => (
        <pointLight key={i} position={light.position as [number, number, number]} intensity={light.intensity} />
      ))}

      <group>
        <Suspense fallback={null}>
          <Model url={modelUrl} effectsEnabled={effectsEnabled} />
        </Suspense>
      </group>

      {/* Contact Shadows - solo se effetti attivi */}
      {effectsEnabled && (
        <ContactShadows
          position={CFG.shadows.position as [number, number, number]}
          opacity={CFG.shadows.opacity}
          scale={CFG.shadows.scale}
          blur={CFG.shadows.blur}
          far={CFG.shadows.far}
          resolution={CFG.shadows.resolution}
        />
      )}

      <CameraController 
        resetKey={resetKey} 
        autoRotate={autoRotate}
        onResumeAutoRotate={onResumeAutoRotate}
        onPauseAutoRotate={onPauseAutoRotate}
      />

      {/* Post-processing effects - solo se abilitati */}
      {effectsEnabled && (
        <EffectComposer multisampling={0}>
          {/* Anti-aliasing */}
          <SMAA />
          
          {/* Tone Mapping - colori cinematografici */}
          <ToneMapping 
            mode={THREE.ACESFilmicToneMapping}
            resolution={256}
            whitePoint={4.0}
            middleGrey={0.6}
            minLuminance={0.01}
            averageLuminance={1.0}
          />
          
          {/* Vignette - scurisce leggermente i bordi */}
          <Vignette 
            offset={0.3}
            darkness={0.5}
          />
        </EffectComposer>
      )}
    </>
  );
}

export default function KitViewer3D({
  modelUrl,
  className = '',
}: KitViewer3DProps) {
  const [resetKey, setResetKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotateEnabled, setAutoRotateEnabled] = useState<boolean>(CFG.autoRotate.enabled);
  const [autoRotate, setAutoRotate] = useState<boolean>(CFG.autoRotate.enabled);
  const [effectsEnabled, setEffectsEnabled] = useState(true);
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

  const pauseAutoRotate = () => {
    isInteractingRef.current = true;
    setIsDragging(true);
    setAutoRotate(false);
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const resumeAutoRotate = () => {
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
    }, CFG.autoRotate.resumeDelay);
  };

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
      className={`w-full h-full relative ${className} ${isFullscreen ? 'bg-black' : ''}`}
      onDoubleClick={() => setResetKey(k => k + 1)}
      style={{ cursor: isDragging ? 'none' : 'grab' }}
    >
      <Canvas
        key={modelUrl}
        camera={{
          position: [0, 0, CFG.camera.initialDistance],
          fov: CFG.camera.fov
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
          effectsEnabled={effectsEnabled}
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
        
        {/* Toggle Effects Button */}
        <button
          onClick={() => setEffectsEnabled(!effectsEnabled)}
          className="p-2 rounded-lg backdrop-blur-md bg-black/50 border border-white/20 hover:bg-black/70 transition-colors"
          title={effectsEnabled ? 'Disattiva effetti grafici' : 'Attiva effetti grafici'}
        >
          <Sparkles 
            className={`w-5 h-5 transition-colors ${effectsEnabled ? 'text-yellow-400' : 'text-white/50'}`} 
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
      
      {/* Help Dialog */}
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
          
          {/* Rotazione */}
          <motion.div variants={staggerItem} className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
              <MousePointer2 className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Rotazione</p>
              <p className="text-muted-foreground text-xs sm:text-sm">Click sinistro + trascina</p>
            </div>
          </motion.div>
          
          {/* Zoom */}
          <motion.div variants={staggerItem} className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
              <ZoomIn className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Zoom</p>
              <p className="text-muted-foreground text-xs sm:text-sm">Scroll del mouse o pinch</p>
            </div>
          </motion.div>
          
          {/* Pan */}
          <motion.div variants={staggerItem} className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
              <Move className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Pan</p>
              <p className="text-muted-foreground text-xs sm:text-sm">Click destro + trascina</p>
            </div>
          </motion.div>
          
          {/* Reset Camera */}
          <motion.div variants={staggerItem} className="flex items-start gap-3">
            <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
              <RotateCcw className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-sm sm:text-base">Reset camera</p>
              <p className="text-muted-foreground text-xs sm:text-sm">Doppio click sul modello</p>
            </div>
          </motion.div>
          
          {/* Divider */}
          <div className="border-t my-4" />
          
          {/* Legenda pulsanti */}
          <p className="text-muted-foreground text-xs uppercase tracking-wide mb-3">Pulsanti</p>
          
          <motion.div variants={staggerItem} className="flex items-center gap-2.5 py-1">
            <RotateCw className="w-5 h-5 text-green-500 shrink-0" />
            <span className="text-sm">Attiva/disattiva rotazione automatica</span>
          </motion.div>
          
          <motion.div variants={staggerItem} className="flex items-center gap-2.5 py-1">
            <Sparkles className="w-5 h-5 text-yellow-500 shrink-0" />
            <span className="text-sm">Attiva/disattiva effetti grafici</span>
          </motion.div>
          
          <motion.div variants={staggerItem} className="flex items-center gap-2.5 py-1">
            <Maximize2 className="w-5 h-5 text-foreground shrink-0" />
            <span className="text-sm">Modalità schermo intero</span>
          </motion.div>
        </motion.div>
      </FramerDialog>
    </div>
  );
}
