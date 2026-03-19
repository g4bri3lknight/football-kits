/**
 * Script per popolare il database con dati di test per benchmark
 * Crea 400 giocatori con 400 kit, ognuno con ~15MB di dati binari
 * 
 * Esecuzione: bun run prisma/seed-benchmark.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurazione dimensioni
const CONFIG = {
  numPlayers: 400,
  numKits: 400,
  // Dimensioni in bytes per raggiungere ~13MB per kit (sicuro per 7.3GB disponibili)
  playerImageSize: 1 * 1024 * 1024,        // 1 MB
  kitImageSize: 1 * 1024 * 1024,           // 1 MB  
  logoSize: 512 * 1024,                    // 512 KB
  model3DSize: 6 * 1024 * 1024,            // 6 MB (ridotto per spazio disponibile)
  detailSize: 700 * 1024,                  // 700 KB each (6 details = 4.2 MB)
};

// Genera un ID univoco
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// Genera bytes casuali con un pattern PNG header per simulare un'immagine
const generateImageBytes = (sizeBytes: number): Buffer => {
  // PNG header signature
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
  ]);
  
  // Riempimento con pattern per simulare dati immagine compressi
  const padding = Buffer.alloc(sizeBytes - pngHeader.length);
  for (let i = 0; i < padding.length; i++) {
    // Pattern che simula dati compressi
    padding[i] = (i * 17 + 43) % 256;
  }
  
  return Buffer.concat([pngHeader, padding]);
};

// Genera bytes per un file GLB (modello 3D)
const generateGLBBytes = (sizeBytes: number): Buffer => {
  // GLB header (Binary glTF)
  // Magic: 0x46546C67 (glTF)
  // Version: 2
  const glbHeader = Buffer.alloc(12);
  glbHeader.writeUInt32LE(0x46546C67, 0); // glTF magic
  glbHeader.writeUInt32LE(2, 4);           // version 2
  glbHeader.writeUInt32LE(sizeBytes, 8);   // total length
  
  // JSON chunk header
  const jsonChunkHeader = Buffer.alloc(8);
  const jsonContent = JSON.stringify({
    asset: { version: "2.0", generator: "benchmark-seed" },
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    accessors: [{ componentType: 5126, count: 3, type: "VEC3" }],
    bufferViews: [{ buffer: 0, byteLength: sizeBytes - 100 }],
    buffers: [{ byteLength: sizeBytes - 100 }]
  });
  const jsonData = Buffer.from(jsonContent);
  jsonChunkHeader.writeUInt32LE(jsonData.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // JSON magic
  
  // BIN chunk header
  const binChunkOffset = 12 + 8 + jsonData.length;
  const binChunkSize = sizeBytes - binChunkOffset - 8;
  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binChunkSize, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // BIN magic
  
  // BIN data (padding)
  const binData = Buffer.alloc(binChunkSize);
  for (let i = 0; i < binData.length; i++) {
    binData[i] = (i * 23 + 67) % 256;
  }
  
  return Buffer.concat([glbHeader, jsonChunkHeader, jsonData, binChunkHeader, binData]);
};

// Nomi e squadre per i test
const firstNames = ['Marco', 'Luca', 'Andrea', 'Francesco', 'Alessandro', 'Matteo', 'Lorenzo', 'Davide', 'Simone', 'Federico'];
const lastNames = ['Rossi', 'Bianchi', 'Verdi', 'Russo', 'Ferrari', 'Esposito', 'Ricci', 'Marino', 'Greco', 'Conti'];
const teams = ['Juventus', 'Milan', 'Inter', 'Roma', 'Lazio', 'Napoli', 'Fiorentina', 'Atalanta', 'Torino', 'Bologna'];
const kitTypes = ['home', 'away', 'third', 'goalkeeper'];

async function main() {
  console.log('🚀 Iniziando il seed del database per benchmark...\n');
  console.log(`📊 Configurazione:
  - Giocatori: ${CONFIG.numPlayers}
  - Kit: ${CONFIG.numKits}
  - Dimensione prevista per kit: ~${((CONFIG.playerImageSize + CONFIG.kitImageSize + CONFIG.logoSize + CONFIG.model3DSize + CONFIG.detailSize * 6) / 1024 / 1024).toFixed(2)} MB
  - Dimensione totale stimata: ~${((CONFIG.numKits * 13 + CONFIG.numPlayers) / 1024).toFixed(2)} GB\n`);

  const startTime = Date.now();

  // Pre-genera i dati binari una sola volta (stessi per tutti)
  console.log('📦 Generazione dati binari...');
  const playerImageData = generateImageBytes(CONFIG.playerImageSize);
  const kitImageData = generateImageBytes(CONFIG.kitImageSize);
  const logoData = generateImageBytes(CONFIG.logoSize);
  const model3DData = generateGLBBytes(CONFIG.model3DSize);
  const detailData = generateImageBytes(CONFIG.detailSize);
  console.log('   ✓ Dati binari generati\n');

  // Crea un ID utente fittizio per i giocatori
  console.log('👥 Creazione giocatori...');
  const players = [];
  
  for (let i = 0; i < CONFIG.numPlayers; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    
    players.push({
      id: `player-${i + 1}`,
      name: firstName,
      surname: `${lastName}${i > 9 ? i : ''}`,
      imageData: playerImageData,
      imageMimeType: 'image/png',
      hasImage: true,
      updatedAt: new Date(),
    });

    // Mostra progresso ogni 100
    if ((i + 1) % 100 === 0) {
      console.log(`   ✓ Creati ${i + 1}/${CONFIG.numPlayers} giocatori in memoria`);
    }
  }
  console.log('   ✓ Tutti i giocatori preparati\n');

  // Crea i kit
  console.log('👕 Creazione kit...');
  const kits = [];
  
  for (let i = 0; i < CONFIG.numKits; i++) {
    const team = teams[i % teams.length];
    const type = kitTypes[i % kitTypes.length];
    const year = 2020 + Math.floor(i / teams.length);
    
    kits.push({
      id: `kit-${i + 1}`,
      name: `${year}/${year + 1}`,
      team: team,
      type: type,
      imageData: kitImageData,
      imageMimeType: 'image/png',
      hasImage: true,
      logoData: logoData,
      logoMimeType: 'image/png',
      hasLogo: true,
      model3DData: model3DData,
      model3DName: `kit-model-${i + 1}.glb`,
      hasModel3D: true,
      detail1Data: detailData,
      detail1MimeType: 'image/png',
      detail1Label: 'Colletto',
      hasDetail1: true,
      detail2Data: detailData,
      detail2MimeType: 'image/png',
      detail2Label: 'Logo',
      hasDetail2: true,
      detail3Data: detailData,
      detail3MimeType: 'image/png',
      detail3Label: 'Maniche',
      hasDetail3: true,
      detail4Data: detailData,
      detail4MimeType: 'image/png',
      detail4Label: 'Pantaloncini',
      hasDetail4: true,
      detail5Data: detailData,
      detail5MimeType: 'image/png',
      detail5Label: 'Calzini',
      hasDetail5: true,
      detail6Data: detailData,
      detail6MimeType: 'image/png',
      detail6Label: 'Dettaglio',
      hasDetail6: true,
      updatedAt: new Date(),
    });

    // Mostra progresso ogni 50
    if ((i + 1) % 50 === 0) {
      console.log(`   ✓ Creati ${i + 1}/${CONFIG.numKits} kit in memoria`);
    }
  }
  console.log('   ✓ Tutti i kit preparati\n');

  // Inserimento nel database - un record alla volta per evitare timeout
  console.log('💾 Inserimento nel database...');
  
  for (let i = 0; i < CONFIG.numPlayers; i++) {
    // Inserisci giocatore
    await prisma.player.create({
      data: players[i]
    });
    
    // Inserisci kit
    await prisma.kit.create({
      data: kits[i]
    });
    
    // Crea associazione PlayerKit
    await prisma.playerKit.create({
      data: {
        id: `playerkit-${i + 1}`,
        playerId: players[i].id,
        kitId: kits[i].id,
        updatedAt: new Date(),
      }
    });
    
    // Mostra progresso ogni 10 record
    if ((i + 1) % 10 === 0) {
      const progress = ((i + 1) / CONFIG.numPlayers * 100).toFixed(1);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✓ Record ${i + 1}/${CONFIG.numPlayers} completato (${progress}%) - ${elapsed}s`);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Seed completato con successo!`);
  console.log(`⏱️  Tempo totale: ${duration} secondi`);
  console.log(`📊 Record creati:`);
  console.log(`   - ${CONFIG.numPlayers} giocatori`);
  console.log(`   - ${CONFIG.numKits} kit`);
  console.log(`   - ${CONFIG.numKits} associazioni PlayerKit`);
  console.log(`💾 Dimensione stimata database: ~${((CONFIG.numKits * 13 + CONFIG.numPlayers) / 1024).toFixed(2)} GB`);
}

main()
  .catch((e) => {
    console.error('❌ Errore durante il seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
