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

// ============================================================================
// CONFIGURAZIONE AREA CENTRALE (SFONDO)
// Modifica questi valori per personalizzare l'area centrale della pagina
// ============================================================================
export const CENTRAL_AREA_CONFIG = {
  // === BACKGROUND ===
  background: {
    // Percorso cartella immagini (relativo a public/)
    folder: 'background',
    
    // Altezza dell'area centrale (null = calcolata automaticamente)
    // Se specificato, sovrascrive il calcolo automatico
    height: null as string | null,
  },
} as const;

// ============================================================================
// CONFIGURAZIONE HEADER
// Modifica questi valori per personalizzare l'header
// ============================================================================
export const HEADER_CONFIG = {
  // === BACKGROUND ===
  background: {
    // Percorso cartella immagini (relativo a public/)
    folder: 'background/header',
    
    // Intervallo cambio immagine (in millisecondi)
    // Esempi: 30000 = 30 secondi, 60000 = 1 minuto, 180000 = 3 minuti
    changeInterval: 10 * 1000, // 10 secondi (per test)
    
    // Opacità overlay scuro (0 = trasparente, 1 = completamente nero)
    // Valori bassi (0.1-0.3) = immagine molto visibile, testo meno leggibile
    // Valori medi (0.4-0.6) = buon compromesso
    // Valori alti (0.7-1.0) = immagine poco visibile, testo molto leggibile
    overlayOpacity: 0.25, // Abbassato per vedere meglio le immagini
  },
} as const;

// ============================================================================
// CONFIGURAZIONE IMMAGINI DETTAGLIO KIT
// Modifica questi valori per personalizzare l'effetto hover
// ============================================================================
export const KIT_DETAIL_IMAGE_CONFIG = {
  // === EFFETTO HOVER ===
  hover: {
    scale: 1.05,               // Fattore di scala (1.05 = 105%, 1.10 = 110%, ecc.)
    transitionDuration: 300,   // Durata transizione in millisecondi
  },

  // === STILE DESCRIZIONE ===
  label: {
    baseSize: {
      mobile: '11px',
      tablet: '13px',
      desktop: '15px',
    },
    hoverScale: 1.2,           // Fattore di scala descrizione durante hover
  },
} as const;

export type KitViewerConfig = typeof KIT_VIEWER_CONFIG;
export type KitDetailImageConfig = typeof KIT_DETAIL_IMAGE_CONFIG;
