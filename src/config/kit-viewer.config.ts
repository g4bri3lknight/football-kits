// ============================================================================
// CONFIGURAZIONE VISUALIZZATORE 3D KIT
// Modifica questi valori per personalizzare il comportamento del viewer
// ============================================================================

export const KIT_VIEWER_CONFIG = {
  // === CAMERA ===
  camera: {
    initialDistance: 6,       // Distanza iniziale della camera
    fov: 50,                  // Campo visivo (Field of View)
    minDistance: 3.5,         // Distanza minima zoom
    maxDistance: 6,           // Distanza massima zoom
  },

  // === ROTAZIONE (angoli in radianti) ===
  rotation: {
    minPolarAngle: Math.PI / 2,      // Angolo minimo rotazione verticale
    maxPolarAngle: Math.PI / 2,      // Angolo massimo rotazione verticale
  },

  // === AUTO-ROTATION ===
  autoRotate: {
    enabled: true,           // Abilita rotazione automatica all'avvio
    speed: 1.5,              // Velocità rotazione automatica
    resumeDelay: 2000,       // Millisecondi prima di riattivare dopo interazione
  },

  // === CONTROLLI ===
  controls: {
    enablePan: true,           // Abilita pan (spostamento con tasto destro)
    enablePanHorizontal: false, // Abilita pan orizzontale (sinistra/destra)
    enablePanVertical: true,   // Abilita pan verticale (sopra/sotto)
    rotateSpeed: 0.5,          // Velocità rotazione mouse
    zoomSpeed: 1.2,            // Velocità zoom rotella
    panSpeed: 1,               // Velocità pan
    enableDamping: true,       // Abilita smorzamento fluido
    dampingFactor: 0.05,       // Fattore smorzamento (0-1)
  },

  // === MODELLO ===
  model: {
    targetSize: 5,             // Dimensione target del modello in unità 3D
  },

  // === ILLUMINAZIONE ===
  lighting: {
    ambientIntensity: 0.7,     // Intensità luce ambientale

    mainLight: {
      position: [5, 10, 7.5],
      intensity: 1.5,
    },

    secondaryLight: {
      position: [-5, 5, -7.5],
      intensity: 0.8,
    },

    fillLights: [
      { position: [0, 5, 5], intensity: 0.6 },
      { position: [0, -2, 5], intensity: 0.3 },
      { position: [5, 0, 5], intensity: 0.4 },
      { position: [-5, 0, 5], intensity: 0.4 },
    ],
  },

  // === OMBRE ===
  shadows: {
    position: [0, -2.45, 0],
    opacity: 0.5,
    scale: 10,
    blur: 2,
    far: 10,
    resolution: 1024,
  },

  // === CANVAS ===
  canvas: {
    height: '580px',
    minHeight: '250px',
  },
} as const;

export type KitViewerConfig = typeof KIT_VIEWER_CONFIG;
