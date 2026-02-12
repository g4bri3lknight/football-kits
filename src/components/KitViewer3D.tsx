'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { Suspense, useEffect, useRef, useMemo, useState } from 'react';
import * as THREE from 'three';
import { getImageUrl } from '@/lib/image-url';

interface KitViewer3DProps {
  modelUrl?: string;
  kitColor?: string;
  maxZoom?: number;
  minZoom?: number;
  enablePan?: boolean;
  className?: string;
}


// Componente placeholder quando non c'è un modello 3D
function KitPlaceholder({ color }: { color?: string }) {
  return (
    <group scale={3}>
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[1, 1.25, 0.25]} />
        <meshStandardMaterial
          color={color || '#ffffff'}
          metalness={0.15}
          roughness={0.6}
        />
      </mesh>
      {/* Collo della maglia */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.3, 0.15, 16]} />
        <meshStandardMaterial
          color={color || '#ffffff'}
          metalness={0.15}
          roughness={0.6}
        />
      </mesh>
      {/* Maniche */}
      <mesh position={[-0.7, 0.4, 0]} rotation={[0, 0, Math.PI / 6]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.2]} />
        <meshStandardMaterial
          color={color || '#ffffff'}
          metalness={0.15}
          roughness={0.6}
        />
      </mesh>
      <mesh position={[0.7, 0.4, 0]} rotation={[0, 0, -Math.PI / 6]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.2]} />
        <meshStandardMaterial
          color={color || '#ffffff'}
          metalness={0.15}
          roughness={0.6}
        />
      </mesh>
    </group>
  );
}

// Componente per caricare modello GLTF con scaling automatico e ottimizzazione
function Model({ url }: { url: string }) {
  const { scene } = useGLTF(getImageUrl(url));
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    if (groupRef.current) {
      // Calcola il bounding box del modello
      const box = new THREE.Box3().setFromObject(scene);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Trova la dimensione maggiore
      const maxDimension = Math.max(size.x, size.y, size.z);

      // Calcola la scala per adattare il modello a circa 5 unità (più grande)
      const scale = 5 / maxDimension;

      // Applica la scala e centra il modello
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.sub(center.multiplyScalar(scale));

      // Ottimizzazione: disabilita o ridurre shadow map per performance
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          child.castShadow = true;
          child.receiveShadow = false; // Evita shadow su piani che potrebbero bloccare la vista
          if (child.material) {
            child.material.side = THREE.DoubleSide;
          }
        }
      });
    }
  }, [scene]);

  return (
    <group ref={groupRef}>
      <primitive object={scene} />
    </group>
  );
}

// Componente Scene interno
function Scene({
  modelUrl,
  kitColor,
  maxZoom,
  minZoom,
  enablePan,
  initialZoom,
  onResetZoom,
  cameraRef,
  controlsRef,
  onInteractionStart,
  onInteractionEnd,
}: KitViewer3DProps & {
  initialZoom?: number;
  onResetZoom?: () => void;
  cameraRef?: React.RefObject<THREE.PerspectiveCamera>;
  controlsRef?: React.RefObject<any>;
  onInteractionStart?: () => void;
  onInteractionEnd?: () => void;
}) {
  const { camera } = useThree();

  // Passa il ref della camera al padre
  useEffect(() => {
    if (cameraRef) {
      cameraRef.current = camera as THREE.PerspectiveCamera;
    }
  }, [camera, cameraRef]);

  // Funzione per resettare lo zoom alla posizione iniziale
  const handleResetZoom = () => {
    if (camera && controlsRef?.current) {
      camera.position.set(0, 0, initialZoom || 18);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      controlsRef.current.reset();
    }
    if (onResetZoom) {
      onResetZoom();
    }
  };

  return (
    <>
      {/* Illuminazione principale stile Sketchfab */}
      <ambientLight intensity={0.7} />

      <directionalLight
        position={[5, 10, 7.5]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight
        position={[-5, 5, -7.5]}
        intensity={0.8}
      />

      {/* Luci di riempimento per illuminare le ombre */}
      <pointLight position={[0, 5, 5]} intensity={0.6} />
      <pointLight position={[0, -2, 5]} intensity={0.3} />
      <pointLight position={[5, 0, 5]} intensity={0.4} />
      <pointLight position={[-5, 0, 5]} intensity={0.4} />

      {/* Modello */}
      <group position={[0, 0, 0]}>
        {modelUrl ? (
          <Suspense fallback={<KitPlaceholder color={kitColor} />}>
            <Model url={modelUrl} />
          </Suspense>
        ) : (
          <KitPlaceholder color={kitColor} />
        )}
      </group>

      {/* Ombra sul piano stile Sketchfab ma più sottile e trasparente */}
      <ContactShadows
        position={[0, -2, 0]}
        opacity={0.3}
        scale={10}
        blur={2}
        far={10}
        resolution={512}
      />

      {/* Controlli con rotazione SOLO verticale */}
      <OrbitControls
        ref={controlsRef}
        enablePan={enablePan !== false}
        enableZoom={true}
        minDistance={minZoom || 2}
        maxDistance={maxZoom || 50}
        minPolarAngle={Math.PI / 2}
        maxPolarAngle={Math.PI / 2}
        rotateSpeed={0.5}
        zoomSpeed={1.2}
        panSpeed={1}
        enableDamping={true}
        dampingFactor={0.05}
        onStart={onInteractionStart}
        onEnd={onInteractionEnd}
      />
    </>
  );
}

// Componente per regolare la camera
function CameraSetup({ initialZoom = 18 }: { initialZoom?: number }) {
  const { camera } = useThree();

  useEffect(() => {
    // Posizione camera centrata
    camera.position.set(0, 0, initialZoom);
    camera.lookAt(0, 0, 0);
  }, [camera, initialZoom]);

  return null;
}

export default function KitViewer3D({
  modelUrl,
  kitColor = '#ffffff',
  maxZoom = 50,
  minZoom = 2,
  enablePan = true,
  className = '',
  initialZoom = 18,
}: KitViewer3DProps & { initialZoom?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Gestione del cursore durante l'interazione
  const handleInteractionStart = () => {
    setIsInteracting(true);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'none';
    }
  };

  const handleInteractionEnd = () => {
    setIsInteracting(false);
    if (containerRef.current) {
      containerRef.current.style.cursor = 'grab';
    }
  };

  // Imposta il cursore iniziale
  useEffect(() => {
    if (containerRef.current && !isInteracting) {
      containerRef.current.style.cursor = 'grab';
    }
  }, [isInteracting]);

  const handleResetZoom = () => {
    if (cameraRef.current && controlsRef.current) {
      cameraRef.current.position.set(0, 0, initialZoom);
      cameraRef.current.lookAt(0, 0, 0);
      cameraRef.current.updateProjectionMatrix();
      controlsRef.current.reset();
    }
    console.log('Zoom resettato al valore iniziale:', initialZoom);
  };

  const handleDoubleClick = () => {
    handleResetZoom();
  };

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{
        minHeight: '400px',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(135deg, #808080 0%, #606060 100%)',
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Canvas
        camera={{ position: [0, 0, initialZoom], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        style={{
          width: '100%',
          height: '800px',
          minHeight: '800px',
          display: 'block',
          outline: 'none',
        }}
      >
        <CameraSetup initialZoom={initialZoom} />
        <Suspense fallback={null}>
          <Scene
            modelUrl={modelUrl}
            kitColor={kitColor}
            maxZoom={maxZoom}
            minZoom={minZoom}
            enablePan={enablePan}
            initialZoom={initialZoom}
            onResetZoom={handleResetZoom}
            cameraRef={cameraRef}
            controlsRef={controlsRef}
            onInteractionStart={handleInteractionStart}
            onInteractionEnd={handleInteractionEnd}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
