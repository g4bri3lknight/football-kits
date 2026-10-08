// Dati di test per provare filtri, campionati e kit.
// Logica separata dal client Prisma: la usa prisma/seed-test.ts.
// Le immagini (maglie, loghi, avatar) sono PNG semplici generate qui, senza dipendenze.

import { deflateSync } from 'node:zlib';
import type { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Mini generatore PNG (RGBA)
// ---------------------------------------------------------------------------
type RGB = [number, number, number];

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

class Canvas {
  data: Uint8Array;
  constructor(public w: number, public h: number) {
    this.data = new Uint8Array(w * h * 4); // trasparente
  }
  px(x: number, y: number, c: RGB) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const i = (y * this.w + x) * 4;
    this.data[i] = c[0];
    this.data[i + 1] = c[1];
    this.data[i + 2] = c[2];
    this.data[i + 3] = 255;
  }
  rect(x0: number, y0: number, x1: number, y1: number, c: RGB) {
    for (let y = Math.round(y0); y < Math.round(y1); y++)
      for (let x = Math.round(x0); x < Math.round(x1); x++) this.px(x, y, c);
  }
  circle(cx: number, cy: number, r: number, c: RGB) {
    for (let y = Math.floor(cy - r); y <= Math.ceil(cy + r); y++)
      for (let x = Math.floor(cx - r); x <= Math.ceil(cx + r); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= r * r) this.px(x, y, c);
  }
  // Poligono pieno (even-odd)
  polygon(pts: [number, number][], c: RGB, color2?: (x: number, y: number) => RGB) {
    const ys = pts.map((p) => p[1]);
    for (let y = Math.floor(Math.min(...ys)); y <= Math.ceil(Math.max(...ys)); y++) {
      const xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const [xa, ya] = pts[i];
        const [xb, yb] = pts[(i + 1) % pts.length];
        if ((ya <= y && yb > y) || (yb <= y && ya > y)) xs.push(xa + ((y - ya) / (yb - ya)) * (xb - xa));
      }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2)
        for (let x = Math.ceil(xs[i]); x < xs[i + 1]; x++) this.px(x, y, color2 ? color2(x, y) : c);
    }
  }
  toPng(): Buffer {
    const raw = Buffer.alloc((this.w * 4 + 1) * this.h);
    for (let y = 0; y < this.h; y++) {
      raw[y * (this.w * 4 + 1)] = 0;
      Buffer.from(this.data.buffer, y * this.w * 4, this.w * 4).copy(raw, y * (this.w * 4 + 1) + 1);
    }
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(this.w, 0);
    ihdr.writeUInt32BE(this.h, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    return Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
  }
}

type Pattern = 'solid' | 'stripes' | 'hoops';

// Maglia stilizzata con colori e disegno della squadra
function jerseyPng(primary: RGB, secondary: RGB, pattern: Pattern): Buffer {
  const c = new Canvas(300, 340);
  const colorAt = (x: number, y: number): RGB => {
    if (pattern === 'stripes') return Math.floor(x / 25) % 2 === 0 ? primary : secondary;
    if (pattern === 'hoops') return Math.floor(y / 28) % 2 === 0 ? primary : secondary;
    return primary;
  };
  // corpo + maniche
  const shape: [number, number][] = [
    [95, 20], [205, 20], [290, 85], [250, 150], [225, 125], [225, 320], [75, 320], [75, 125], [50, 150], [10, 85],
  ];
  c.polygon(shape, primary, colorAt);
  // bordo maniche e colletto
  c.polygon([[10, 85], [50, 150], [66, 133], [30, 72]], secondary);
  c.polygon([[290, 85], [250, 150], [234, 133], [270, 72]], secondary);
  c.polygon([[115, 20], [185, 20], [150, 62]], [245, 245, 245]);
  c.polygon([[125, 20], [175, 20], [150, 48]], secondary);
  return c.toPng();
}

// Logo tondo: anello esterno + cerchio interno + piccola stella
function leagueLogoPng(outer: RGB, inner: RGB): Buffer {
  const c = new Canvas(128, 128);
  c.circle(64, 64, 60, outer);
  c.circle(64, 64, 44, [255, 255, 255]);
  c.circle(64, 64, 36, inner);
  c.rect(58, 30, 70, 98, [255, 255, 255]);
  c.rect(30, 58, 98, 70, [255, 255, 255]);
  return c.toPng();
}

// Avatar giocatore: sfondo colorato + busto
function avatarPng(bg: RGB, shirt: RGB): Buffer {
  const c = new Canvas(200, 240);
  c.rect(0, 0, 200, 240, bg);
  c.circle(100, 85, 42, [235, 195, 160]);
  c.polygon([[30, 240], [50, 150], [150, 150], [170, 240]], shirt);
  return c.toPng();
}

// ---------------------------------------------------------------------------
// Dati
// ---------------------------------------------------------------------------
// I nomi sono in italiano come nel DB reale; i codici sono ISO alpha-3 (usati per le bandiere).
// Croazia e Scozia non hanno giocatori; Portogallo ha un campionato ma nessun kit:
// non devono comparire nei filtri.
const NATIONS = [
  { name: 'Italia', code: 'ITA' },
  { name: 'Spagna', code: 'ESP' },
  { name: 'Germania', code: 'GER' },
  { name: 'Francia', code: 'FRA' },
  { name: 'Inghilterra', code: 'ENG' },
  { name: 'Portogallo', code: 'POR' },
  { name: 'Paesi Bassi', code: 'NED' },
  { name: 'Brasile', code: 'BRA' },
  { name: 'Argentina', code: 'ARG' },
  { name: 'Croazia', code: 'CRO' },
  { name: 'Scozia', code: 'SCO' },
];

const LEAGUES: { key: string; season: string; name: string; nation: string; colors: [RGB, RGB] }[] = [
  { key: 'sa0001', season: '2000/01', name: 'Serie A', nation: 'Italia', colors: [[0, 90, 160], [0, 150, 210]] },
  { key: 'sa0506', season: '2005/06', name: 'Serie A', nation: 'Italia', colors: [[0, 90, 160], [0, 150, 210]] },
  { key: 'sa0607', season: '2006/07', name: 'Serie A', nation: 'Italia', colors: [[0, 90, 160], [0, 150, 210]] },
  { key: 'pl0506', season: '2005/06', name: 'Premier League', nation: 'Inghilterra', colors: [[60, 0, 100], [120, 40, 170]] },
  { key: 'pl1011', season: '2010/11', name: 'Premier League', nation: 'Inghilterra', colors: [[60, 0, 100], [120, 40, 170]] },
  { key: 'll0809', season: '2008/09', name: 'La Liga', nation: 'Spagna', colors: [[200, 30, 30], [235, 120, 40]] },
  { key: 'll1011', season: '2010/11', name: 'La Liga', nation: 'Spagna', colors: [[200, 30, 30], [235, 120, 40]] },
  { key: 'bl0506', season: '2005/06', name: 'Bundesliga', nation: 'Germania', colors: [[200, 20, 20], [30, 30, 30]] },
  { key: 'l10506', season: '2005/06', name: 'Ligue 1', nation: 'Francia', colors: [[20, 40, 110], [60, 130, 200]] },
  // Campionato senza kit: non deve comparire nei filtri della home
  { key: 'pt0506', season: '2005/06', name: 'Primeira Liga', nation: 'Portogallo', colors: [[0, 110, 50], [200, 30, 40]] },
];

type KitDef = {
  key: string;
  team: string;
  type: 'home' | 'away' | 'third' | 'goalkeeper';
  league?: string; // key di LEAGUES; la stagione del kit è quella del campionato
  season?: string; // solo per i kit senza campionato
  colors: [RGB, RGB, Pattern];
};

const KITS: KitDef[] = [
  { key: 'juve0506h', team: 'Juventus', type: 'home', league: 'sa0506', colors: [[245, 245, 245], [20, 20, 20], 'stripes'] },
  { key: 'juve0506a', team: 'Juventus', type: 'away', league: 'sa0506', colors: [[230, 190, 40], [20, 20, 20], 'solid'] },
  { key: 'milan0607h', team: 'Milan', type: 'home', league: 'sa0607', colors: [[200, 20, 30], [20, 20, 20], 'stripes'] },
  { key: 'milan0607g', team: 'Milan', type: 'goalkeeper', league: 'sa0607', colors: [[40, 160, 60], [20, 20, 20], 'solid'] },
  { key: 'inter0001h', team: 'Inter', type: 'home', league: 'sa0001', colors: [[20, 60, 160], [20, 20, 20], 'stripes'] },
  { key: 'roma0001h', team: 'Roma', type: 'home', league: 'sa0001', colors: [[150, 30, 40], [235, 170, 30], 'solid'] },
  { key: 'arsenal0506h', team: 'Arsenal', type: 'home', league: 'pl0506', colors: [[210, 30, 40], [245, 245, 245], 'solid'] },
  { key: 'manutd1011h', team: 'Manchester United', type: 'home', league: 'pl1011', colors: [[205, 25, 35], [20, 20, 20], 'solid'] },
  { key: 'manutd1011a', team: 'Manchester United', type: 'away', league: 'pl1011', colors: [[245, 245, 245], [20, 20, 20], 'solid'] },
  { key: 'real0809h', team: 'Real Madrid', type: 'home', league: 'll0809', colors: [[245, 245, 245], [40, 80, 180], 'solid'] },
  { key: 'barca1011h', team: 'Barcellona', type: 'home', league: 'll1011', colors: [[160, 30, 70], [20, 50, 140], 'stripes'] },
  { key: 'bayern0506h', team: 'Bayern Monaco', type: 'home', league: 'bl0506', colors: [[210, 20, 30], [245, 245, 245], 'solid'] },
  { key: 'bayern0506g', team: 'Bayern Monaco', type: 'goalkeeper', league: 'bl0506', colors: [[30, 30, 30], [210, 20, 30], 'solid'] },
  { key: 'lyon0506h', team: 'Lione', type: 'home', league: 'l10506', colors: [[245, 245, 245], [30, 60, 160], 'solid'] },
  // Nazionali: nessun campionato, stagione manuale
  { key: 'ita2006h', team: 'Italia', type: 'home', season: '2006', colors: [[30, 90, 200], [245, 245, 245], 'solid'] },
  { key: 'ita2006g', team: 'Italia', type: 'goalkeeper', season: '2006', colors: [[230, 190, 40], [20, 20, 20], 'solid'] },
  { key: 'ita1982h', team: 'Italia', type: 'home', season: '1982', colors: [[30, 90, 200], [245, 245, 245], 'solid'] },
  { key: 'spa2010h', team: 'Spagna', type: 'home', season: '2010', colors: [[200, 30, 40], [235, 190, 40], 'solid'] },
  { key: 'ger2006h', team: 'Germania', type: 'home', season: '2006', colors: [[245, 245, 245], [20, 20, 20], 'solid'] },
  { key: 'bra2002h', team: 'Brasile', type: 'home', season: '2002', colors: [[245, 215, 30], [30, 130, 60], 'solid'] },
  { key: 'arg1986h', team: 'Argentina', type: 'home', season: '1986', colors: [[130, 190, 235], [245, 245, 245], 'stripes'] },
];

const PLAYERS: { name: string; surname: string; nation: string; status: 'NUOVO' | 'AGGIORNATO' | 'NON_IMPOSTATO'; kits: string[] }[] = [
  { name: 'Gianluigi', surname: 'Buffon', nation: 'Italia', status: 'AGGIORNATO', kits: ['juve0506h', 'juve0506a', 'ita2006g', 'milan0607g'] },
  { name: 'Dino', surname: 'Zoff', nation: 'Italia', status: 'NON_IMPOSTATO', kits: ['juve0506h', 'ita1982h'] },
  { name: 'Walter', surname: 'Zenga', nation: 'Italia', status: 'NUOVO', kits: ['inter0001h', 'ita2006h'] },
  { name: 'Angelo', surname: 'Peruzzi', nation: 'Italia', status: 'NON_IMPOSTATO', kits: ['roma0001h', 'inter0001h', 'milan0607h'] },
  { name: 'Iker', surname: 'Casillas', nation: 'Spagna', status: 'AGGIORNATO', kits: ['real0809h', 'spa2010h', 'barca1011h'] },
  { name: 'Victor', surname: 'Valdes', nation: 'Spagna', status: 'NON_IMPOSTATO', kits: ['barca1011h', 'spa2010h'] },
  { name: 'Oliver', surname: 'Kahn', nation: 'Germania', status: 'NON_IMPOSTATO', kits: ['bayern0506h', 'bayern0506g', 'ger2006h'] },
  { name: 'Manuel', surname: 'Neuer', nation: 'Germania', status: 'NUOVO', kits: ['bayern0506g', 'ger2006h'] },
  { name: 'David', surname: 'Seaman', nation: 'Inghilterra', status: 'NON_IMPOSTATO', kits: ['arsenal0506h', 'manutd1011a'] },
  { name: 'Edwin', surname: 'van der Sar', nation: 'Paesi Bassi', status: 'AGGIORNATO', kits: ['manutd1011h', 'manutd1011a', 'juve0506a'] },
  { name: 'Fabien', surname: 'Barthez', nation: 'Francia', status: 'NON_IMPOSTATO', kits: ['manutd1011h', 'lyon0506h'] },
  { name: 'Dida', surname: '', nation: 'Brasile', status: 'NON_IMPOSTATO', kits: ['milan0607h', 'milan0607g', 'bra2002h'] },
  { name: 'Sergio', surname: 'Goycochea', nation: 'Argentina', status: 'NON_IMPOSTATO', kits: ['arg1986h'] },
];

// ---------------------------------------------------------------------------
// Inserimento
// ---------------------------------------------------------------------------
let counter = 0;
const newId = (prefix: string) => `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}`;

export async function seedTestData(prisma: PrismaClient, opts: { reset?: boolean } = {}) {
  const [nationCount, leagueCount, kitCount, playerCount] = await Promise.all([
    prisma.nation.count(),
    prisma.league.count(),
    prisma.kit.count(),
    prisma.player.count(),
  ]);
  if (nationCount + leagueCount + kitCount + playerCount > 0) {
    if (!opts.reset) {
      throw new Error(
        'Il database contiene già dati (nazioni, campionati, kit o giocatori). ' +
          'Per cancellarli e inserire i dati di test usa --reset (ATTENZIONE: cancella tutto).'
      );
    }
    await prisma.commentVote.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.kitVote.deleteMany();
    await prisma.playerKit.deleteMany();
    await prisma.kit.deleteMany();
    await prisma.league.deleteMany();
    await prisma.player.deleteMany();
    await prisma.nation.deleteMany();
  }

  const now = new Date();

  const nationIds: Record<string, string> = {};
  for (const n of NATIONS) {
    const id = newId('nat');
    nationIds[n.name] = id;
    await prisma.nation.create({ data: { id, name: n.name, code: n.code, updatedAt: now } });
  }

  const leagueIds: Record<string, string> = {};
  const leagueSeason: Record<string, string> = {};
  for (const l of LEAGUES) {
    const created = await prisma.league.create({
      data: {
        season: l.season,
        name: l.name,
        nation: l.nation,
        hasLogo: true,
        logoData: new Uint8Array(leagueLogoPng(l.colors[0], l.colors[1])),
        logoMimeType: 'image/png',
      },
    });
    leagueIds[l.key] = created.id;
    leagueSeason[l.key] = l.season;
  }

  const kitIds: Record<string, string> = {};
  for (const k of KITS) {
    const id = newId('kit');
    kitIds[k.key] = id;
    await prisma.kit.create({
      data: {
        id,
        // La stagione del kit è quella del campionato, se presente
        name: k.league ? leagueSeason[k.league] : (k.season as string),
        team: k.team,
        type: k.type,
        leagueId: k.league ? leagueIds[k.league] : null,
        status: 'NON_IMPOSTATO',
        hasImage: true,
        imageData: new Uint8Array(jerseyPng(k.colors[0], k.colors[1], k.colors[2])),
        imageMimeType: 'image/png',
        updatedAt: now,
      },
    });
  }

  for (const [i, p] of PLAYERS.entries()) {
    const id = newId('ply');
    const hue = (i * 47) % 255;
    await prisma.player.create({
      data: {
        id,
        name: p.name,
        surname: p.surname || null,
        nationId: nationIds[p.nation],
        status: p.status,
        biography: `Giocatore di test (${p.nation}).`,
        hasImage: true,
        imageData: new Uint8Array(avatarPng([60 + (hue % 80), 70 + ((hue * 2) % 80), 100 + ((hue * 3) % 80)], [220, 220, 220])),
        imageMimeType: 'image/png',
        updatedAt: now,
      },
    });
    for (const kitKey of p.kits) {
      await prisma.playerKit.create({
        data: { id: newId('pk'), playerId: id, kitId: kitIds[kitKey], updatedAt: now },
      });
    }
  }

  return {
    nations: NATIONS.length,
    leagues: LEAGUES.length,
    kits: KITS.length,
    players: PLAYERS.length,
  };
}
