// ============================================================================
// CONFIGURAZIONE VISUALIZZATORE 3D KIT
// Modifica questi valori per personalizzare il comportamento del viewer
// ============================================================================

export const KIT_VIEWER_CONFIG = {
  // Posizione del modello [X, Y, Z]
  modelPosition: { x: 0, y: 0.5, z: 0 },

  // Configurazione Camera
  camera: {
    initialDistance: 6,       // Distanza iniziale della camera
    fov: 50,                  // Campo visivo (Field of View)
    minDistance: 3.5,           // Distanza minima zoom
    maxDistance: 6,          // Distanza massima zoom
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
    position: [0, -2.45, 0],    // Posizione piano ombre
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

export type KitViewerConfig = typeof KIT_VIEWER_CONFIG;
