'use client';

import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Shirt } from 'lucide-react';
import { KIT_VIEWER_CONFIG } from '@/config/kit-viewer.config';

const CFG = KIT_VIEWER_CONFIG;

interface KitViewer3DProps {
  modelUrl?: string;
  className?: string;
}

// Componente Modello
function Model({ url }: { url: string }) {
  // L'URL è già completo (es. /api/kits/xxx/model3d), non serve elaborarlo
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
}: { 
  modelUrl: string; 
  resetKey: number;
  autoRotate: boolean;
  onResumeAutoRotate: () => void;
  onPauseAutoRotate: () => void;
}) {
  return (
    <>
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
          <Model url={modelUrl} />
        </Suspense>
      </group>

      <ContactShadows
        position={CFG.shadows.position as [number, number, number]}
        opacity={CFG.shadows.opacity}
        scale={CFG.shadows.scale}
        blur={CFG.shadows.blur}
        far={CFG.shadows.far}
        resolution={CFG.shadows.resolution}
      />

      <CameraController 
        resetKey={resetKey} 
        autoRotate={autoRotate}
        onResumeAutoRotate={onResumeAutoRotate}
        onPauseAutoRotate={onPauseAutoRotate}
      />
    </>
  );
}

export default function KitViewer3D({
  modelUrl,
  className = '',
}: KitViewer3DProps) {
  const [resetKey, setResetKey] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState<boolean>(CFG.autoRotate.enabled);
  const resumeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInteractingRef = useRef(false);

  const pauseAutoRotate = () => {
    isInteractingRef.current = true;
    setIsDragging(true);
    setAutoRotate(false);
    // Cancella qualsiasi timeout pendente
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
  };

  const resumeAutoRotate = () => {
    isInteractingRef.current = false;
    setIsDragging(false);
    // Cancella timeout precedente se esiste
    if (resumeTimeoutRef.current) {
      clearTimeout(resumeTimeoutRef.current);
      resumeTimeoutRef.current = null;
    }
    // Imposta nuovo timeout solo se non c'è già un'interazione in corso
    resumeTimeoutRef.current = setTimeout(() => {
      // Verifica che non ci sia una nuova interazione iniziata mentre aspettavamo
      if (!isInteractingRef.current) {
        setAutoRotate(CFG.autoRotate.enabled);
      }
      resumeTimeoutRef.current = null;
    }, CFG.autoRotate.resumeDelay);
  };

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

  return (
    <div 
      className={`w-full h-full ${className}`}
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
      >
        <Scene 
          modelUrl={modelUrl} 
          resetKey={resetKey}
          autoRotate={autoRotate}
          onResumeAutoRotate={resumeAutoRotate}
          onPauseAutoRotate={pauseAutoRotate}
        />
      </Canvas>
    </div>
  );
}
