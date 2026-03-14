/**
 * Script per popolare il database con dati di test per benchmark - VERSIONE RIDOTTA
 * Crea 100 giocatori con 100 kit per test rapidi
 * 
 * Esecuzione: npx tsx prisma/seed-benchmark-small.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Configurazione dimensioni RIDOTTA
const CONFIG = {
  numPlayers: 100,  // Ridotto da 400
  numKits: 100,     // Ridotto da 400
  // Dimensioni più piccole per evitare errori I/O SQLite
  playerImageSize: 200 * 1024,           // 200 KB
  kitImageSize: 200 * 1024,              // 200 KB  
  logoSize: 100 * 1024,                  // 100 KB
  model3DSize: 500 * 1024,               // 500 KB
  detailSize: 100 * 1024,                // 100 KB each (6 details = 600 KB)
};

// Genera bytes casuali con un pattern PNG header per simulare un'immagine
const generateImageBytes = (sizeBytes: number): Buffer => {
  const pngHeader = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
    0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52,
  ]);
  
  const padding = Buffer.alloc(sizeBytes - pngHeader.length);
  for (let i = 0; i < padding.length; i++) {
    padding[i] = (i * 17 + 43) % 256;
  }
  
  return Buffer.concat([pngHeader, padding]);
};

// Genera bytes per un file GLB (modello 3D)
const generateGLBBytes = (sizeBytes: number): Buffer => {
  const glbHeader = Buffer.alloc(12);
  glbHeader.writeUInt32LE(0x46546C67, 0);
  glbHeader.writeUInt32LE(2, 4);
  glbHeader.writeUInt32LE(sizeBytes, 8);
  
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
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4);
  
  const binChunkOffset = 12 + 8 + jsonData.length;
  const binChunkSize = sizeBytes - binChunkOffset - 8;
  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binChunkSize, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4);
  
  const binData = Buffer.alloc(binChunkSize);
  for (let i = 0; i < binData.length; i++) {
    binData[i] = (i * 23 + 67) % 256;
  }
  
  return Buffer.concat([glbHeader, jsonChunkHeader, jsonData, binChunkHeader, binData]);
};

const firstNames = ['Marco', 'Luca', 'Andrea', 'Francesco', 'Alessandro', 'Matteo', 'Lorenzo', 'Davide', 'Simone', 'Federico'];
const lastNames = ['Rossi', 'Bianchi', 'Verdi', 'Russo', 'Ferrari', 'Esposito', 'Ricci', 'Marino', 'Greco', 'Conti'];
const teams = ['Juventus', 'Milan', 'Inter', 'Roma', 'Lazio', 'Napoli', 'Fiorentina', 'Atalanta', 'Torino', 'Bologna'];
const kitTypes = ['home', 'away', 'third', 'goalkeeper'];

async function main() {
  const totalSize = CONFIG.playerImageSize + CONFIG.kitImageSize + CONFIG.logoSize + CONFIG.model3DSize + CONFIG.detailSize * 6;
  
  console.log('🚀 Iniziando il seed del database per benchmark (VERSIONE RIDOTTA)...\n');
  console.log(`📊 Configurazione:
  - Giocatori: ${CONFIG.numPlayers}
  - Kit: ${CONFIG.numKits}
  - Dimensione per kit: ~${(totalSize / 1024 / 1024).toFixed(2)} MB
  - Dimensione totale stimata: ~${((CONFIG.numKits * 13) / 1024).toFixed(2)} GB\n`);

  const startTime = Date.now();

  console.log('📦 Generazione dati binari...');
  const playerImageData = generateImageBytes(CONFIG.playerImageSize);
  const kitImageData = generateImageBytes(CONFIG.kitImageSize);
  const logoData = generateImageBytes(CONFIG.logoSize);
  const model3DData = generateGLBBytes(CONFIG.model3DSize);
  const detailData = generateImageBytes(CONFIG.detailSize);
  console.log('   ✓ Dati binari generati\n');

  console.log('💾 Inserimento nel database...');
  
  for (let i = 0; i < CONFIG.numPlayers; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const team = teams[i % teams.length];
    const type = kitTypes[i % kitTypes.length];
    const year = 2020 + Math.floor(i / teams.length);
    
    // Crea giocatore
    await prisma.player.create({
      data: {
        id: `player-${i + 1}`,
        name: firstName,
        surname: `${lastName}${i > 9 ? i : ''}`,
        imageData: playerImageData,
        imageMimeType: 'image/png',
        hasImage: true,
        updatedAt: new Date(),
      }
    });
    
    // Crea kit
    await prisma.kit.create({
      data: {
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
      }
    });
    
    // Crea associazione PlayerKit
    await prisma.playerKit.create({
      data: {
        id: `playerkit-${i + 1}`,
        playerId: `player-${i + 1}`,
        kitId: `kit-${i + 1}`,
        updatedAt: new Date(),
      }
    });
    
    // Mostra progresso ogni 5 record
    if ((i + 1) % 5 === 0) {
      const progress = ((i + 1) / CONFIG.numPlayers * 100).toFixed(0);
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`   ✓ Record ${i + 1}/${CONFIG.numPlayers} (${progress}%) - ${elapsed}s`);
    }
  }

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  console.log(`\n✅ Seed completato!`);
  console.log(`⏱️  Tempo totale: ${duration}s`);
  console.log(`📊 Record creati: ${CONFIG.numPlayers} giocatori, ${CONFIG.numKits} kit`);
}

main()
  .catch((e) => {
    console.error('❌ Errore:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
