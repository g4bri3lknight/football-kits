'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, ContactShadows } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { getImageUrl } from '@/lib/image-url';
import { Shirt } from 'lucide-react';
import { KIT_VIEWER_CONFIG } from '@/config/kit-viewer.config';

const VIEWER_CONFIG = KIT_VIEWER_CONFIG;

interface KitViewer3DProps {
  modelUrl?: string;
  maxZoom?: number;
  minZoom?: number;
  enablePan?: boolean;
  className?: string;
}

// Componente Modello - calcola solo posizione e scala
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(getImageUrl(url));
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (!groupRef.current) return;

    const box = new THREE.Box3().setFromObject(scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z);
    const scale = VIEWER_CONFIG.model.targetSize / maxDimension;

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

// Componente per resettare camera
function CameraReset({ resetKey }: { resetKey: number }) {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  useEffect(() => {
    camera.position.set(0, 0, VIEWER_CONFIG.camera.initialDistance);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, [camera, resetKey]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={VIEWER_CONFIG.controls.enablePan}
      minDistance={VIEWER_CONFIG.camera.minDistance}
      maxDistance={VIEWER_CONFIG.camera.maxDistance}
      minPolarAngle={VIEWER_CONFIG.rotation.minPolarAngle}
      maxPolarAngle={VIEWER_CONFIG.rotation.maxPolarAngle}
      rotateSpeed={VIEWER_CONFIG.controls.rotateSpeed}
      zoomSpeed={VIEWER_CONFIG.controls.zoomSpeed}
      panSpeed={VIEWER_CONFIG.controls.panSpeed}
      enableDamping={VIEWER_CONFIG.controls.enableDamping}
      dampingFactor={VIEWER_CONFIG.controls.dampingFactor}
    />
  );
}

// Scene con illuminazione
function Scene({ modelUrl, resetKey }: { modelUrl: string; resetKey: number }) {
  return (
    <>
      {/* Illuminazione */}
      <ambientLight intensity={VIEWER_CONFIG.lighting.ambientIntensity} />
      <directionalLight
        position={VIEWER_CONFIG.lighting.mainLight.position}
        intensity={VIEWER_CONFIG.lighting.mainLight.intensity}
        castShadow
      />
      <directionalLight
        position={VIEWER_CONFIG.lighting.secondaryLight.position}
        intensity={VIEWER_CONFIG.lighting.secondaryLight.intensity}
      />
      {VIEWER_CONFIG.lighting.fillLights.map((light, i) => (
        <pointLight key={i} position={light.position} intensity={light.intensity} />
      ))}

      {/* Modello */}
      <group>
        <Suspense fallback={null}>
          <Model url={modelUrl} />
        </Suspense>
      </group>

      {/* Ombra */}
      <ContactShadows
        position={VIEWER_CONFIG.shadows.position}
        opacity={VIEWER_CONFIG.shadows.opacity}
        scale={VIEWER_CONFIG.shadows.scale}
        blur={VIEWER_CONFIG.shadows.blur}
        far={VIEWER_CONFIG.shadows.far}
        resolution={VIEWER_CONFIG.shadows.resolution}
      />

      {/* Controlli con reset */}
      <CameraReset resetKey={resetKey} />
    </>
  );
}

export default function KitViewer3D({
  modelUrl,
  className = '',
}: KitViewer3DProps & { initialZoom?: number }) {
  const [resetKey, setResetKey] = useState(0);

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
    >
      <Canvas
        key={modelUrl}
        camera={{ 
          position: [0, 0, VIEWER_CONFIG.camera.initialDistance], 
          fov: VIEWER_CONFIG.camera.fov 
        }}
        gl={{ antialias: true, alpha: true }}
      >
        <Scene modelUrl={modelUrl} resetKey={resetKey} />
      </Canvas>
    </div>
  );
}
