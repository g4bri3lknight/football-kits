'use client';

import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Environment, ContactShadows } from '@react-three/drei';
import { Suspense, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { getImageUrl } from '@/lib/image-url';
import { Shirt } from 'lucide-react';

// ============================================================================
// CONFIGURAZIONE PARAMETRI VISUALIZZATORE 3D
// Modifica questi valori per personalizzare il comportamento del viewer
// ============================================================================
const VIEWER_CONFIG = {
  // Posizione del modello [X, Y, Z]
  modelPosition: { x: 0, y: 0.5, z: 0 },

  // Configurazione Camera
  camera: {
    initialDistance: 7,       // Distanza iniziale della camera
    fov: 50,                  // Campo visivo (Field of View)
    minDistance: 3.5,           // Distanza minima zoom
    maxDistance: 7,          // Distanza massima zoom
  },

  // Angoli di rotazione (in radianti)
  rotation: {
    minPolarAngle: Math.PI / 2,      // Angolo minimo rotazione verticale (dal basso)
    maxPolarAngle: Math.PI / 2,      // Angolo massimo rotazione verticale (dall'alto)
  },

  // Velocità controlli
  controls: {
    rotateSpeed: 0.5,        // Velocità rotazione
    zoomSpeed: 1.2,          // Velocità zoom
    panSpeed: 1,             // Velocità pan
    dampingFactor: 0.05,     // Fattore smorzamento (0-1)
    enableDamping: true,     // Abilita smorzamento fluido
    enablePan: true,         // Abilita pan (spostamento)
  },

  // Configurazione tasti mouse
  mouseButtons: {
    LEFT: 0,   // ROTATE - Tasto sinistro ruota la camera
    MIDDLE: 1, // DOLLY - Tasto centrale (rotella) zoom
    RIGHT: 2,   // PAN - Tasto destro sposta la camera
  },

  // Dimensioni e scaling
  model: {
    targetSize: 5,           // Dimensione target del modello in unità 3D
  },

  // Configurazione Illuminazione
  lighting: {
    ambientIntensity: 0.7,    // Intensità luce ambientale

    // Luce direzionale principale (con ombre)
    mainLight: {
      position: [5, 10, 7.5],
      intensity: 1.5,
      shadowMapSize: 1024,
    },

    // Luce direzionale secondaria
    secondaryLight: {
      position: [-5, 5, -7.5],
      intensity: 0.8,
    },

    // Luci di riempimento (point lights)
    fillLights: [
      { position: [0, 5, 5], intensity: 0.6 },
      { position: [0, -2, 5], intensity: 0.3 },
      { position: [5, 0, 5], intensity: 0.4 },
      { position: [-5, 0, 5], intensity: 0.4 },
    ],
  },

  // Ombre
  shadows: {
    position: [0, -2, 0],    // Posizione piano ombre
    opacity: 0.5,           // Opacità ombra
    scale: 10,               // Dimensione ombra
    blur: 2,                 // Sfocatura ombra
    far: 10,                 // Distanza rendering ombra
    resolution: 1024,         // Risoluzione ombra
  },

  // Canvas
  canvas: {
    height: '580px',
    minHeight: '250px',
  },
} as const;

// Tipi per le props
interface KitViewer3DProps {
  modelUrl?: string;
  maxZoom?: number;
  minZoom?: number;
  enablePan?: boolean;
  className?: string;
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

      // Calcola la scala per adattare il modello usando la config
      const scale = VIEWER_CONFIG.model.targetSize / maxDimension;

      // Applica la scala e centra il modello
      groupRef.current.scale.setScalar(scale);
      groupRef.current.position.sub(center.multiplyScalar(scale));

      // Ottimizzazione: disabilita o riduce shadow map per performance
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
      camera.position.set(0, 0, initialZoom || VIEWER_CONFIG.camera.initialDistance);
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
      {/* Illuminazione principale */}
      <ambientLight intensity={VIEWER_CONFIG.lighting.ambientIntensity} />

      {/* Luce direzionale principale con ombre */}
      <directionalLight
        position={VIEWER_CONFIG.lighting.mainLight.position}
        intensity={VIEWER_CONFIG.lighting.mainLight.intensity}
        castShadow
        shadow-mapSize={[VIEWER_CONFIG.lighting.mainLight.shadowMapSize, VIEWER_CONFIG.lighting.mainLight.shadowMapSize]}
      />

      {/* Luce direzionale secondaria */}
      <directionalLight
        position={VIEWER_CONFIG.lighting.secondaryLight.position}
        intensity={VIEWER_CONFIG.lighting.secondaryLight.intensity}
      />

      {/* Luci di riempimento per illuminare le ombre */}
      {VIEWER_CONFIG.lighting.fillLights.map((light, index) => (
        <pointLight
          key={`fill-light-${index}`}
          position={light.position}
          intensity={light.intensity}
        />
      ))}

      {/* Modello - posizione più in alto rispetto alla camera */}
      <group position={[VIEWER_CONFIG.modelPosition.x, VIEWER_CONFIG.modelPosition.y, VIEWER_CONFIG.modelPosition.z]}>
        <Suspense fallback={null}>
          <Model url={modelUrl} />
        </Suspense>
      </group>

      {/* Ombra sul piano */}
      <ContactShadows
        position={VIEWER_CONFIG.shadows.position}
        opacity={VIEWER_CONFIG.shadows.opacity}
        scale={VIEWER_CONFIG.shadows.scale}
        blur={VIEWER_CONFIG.shadows.blur}
        far={VIEWER_CONFIG.shadows.far}
        resolution={VIEWER_CONFIG.shadows.resolution}
      />

      {/* Controlli orbit con tutti i parametri configurabili */}
      <OrbitControls
        ref={controlsRef}
        enablePan={enablePan ?? VIEWER_CONFIG.controls.enablePan}
        enableZoom={true}
        minDistance={minZoom || VIEWER_CONFIG.camera.minDistance}
        maxDistance={maxZoom || VIEWER_CONFIG.camera.maxDistance}
        minPolarAngle={VIEWER_CONFIG.rotation.minPolarAngle}
        maxPolarAngle={VIEWER_CONFIG.rotation.maxPolarAngle}
        rotateSpeed={VIEWER_CONFIG.controls.rotateSpeed}
        zoomSpeed={VIEWER_CONFIG.controls.zoomSpeed}
        panSpeed={VIEWER_CONFIG.controls.panSpeed}
        enableDamping={VIEWER_CONFIG.controls.enableDamping}
        dampingFactor={VIEWER_CONFIG.controls.dampingFactor}
        mouseButtons={VIEWER_CONFIG.mouseButtons}
        onStart={onInteractionStart}
        onEnd={onInteractionEnd}
      />
    </>
  );
}

// Componente per regolare la camera
function CameraSetup({ initialZoom }: { initialZoom?: number }) {
  const { camera } = useThree();

  useEffect(() => {
    // Posizione camera centrata usando la config
    camera.position.set(0, 0, initialZoom || VIEWER_CONFIG.camera.initialDistance);
    camera.lookAt(0, 0, 0);
  }, [camera, initialZoom]);

  return null;
}

export default function KitViewer3D({
  modelUrl,
  maxZoom = VIEWER_CONFIG.camera.maxDistance,
  minZoom = VIEWER_CONFIG.camera.minDistance,
  enablePan = VIEWER_CONFIG.controls.enablePan,
  className = '',
  initialZoom = VIEWER_CONFIG.camera.initialDistance,
}: KitViewer3DProps & { initialZoom?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<any>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  // Imposta il cursore iniziale
  useEffect(() => {
    if (containerRef.current && !isInteracting) {
      containerRef.current.style.cursor = 'grab';
    }
  }, [isInteracting]);

  // Se non c'è un modello, mostra solo un messaggio
  if (!modelUrl) {
    return (
      <div
        className={`w-full h-full flex items-center justify-center ${className}`}
        style={{
          minHeight: VIEWER_CONFIG.canvas.minHeight,
        }}
      >
        <div className="text-center p-8">
          <Shirt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground">
            Nessun modello presente
          </p>
        </div>
      </div>
    );
  }

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
        minHeight: VIEWER_CONFIG.canvas.minHeight,
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
      onDoubleClick={handleDoubleClick}
    >
      <Canvas
        key={modelUrl}
        camera={{ position: [0, 0, initialZoom], fov: VIEWER_CONFIG.camera.fov }}
        gl={{
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
        }}
        style={{
          width: '100%',
          height: VIEWER_CONFIG.canvas.height,
          display: 'block',
          outline: 'none',
        }}
      >
        <CameraSetup initialZoom={initialZoom} />
        <Suspense fallback={null}>
          <Scene
            modelUrl={modelUrl}
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
