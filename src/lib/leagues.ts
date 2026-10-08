import { NextRequest } from 'next/server';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isAdminRequest } from '@/lib/auth';

// Dimensione massima del logo (dopo la decodifica da base64)
const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export interface LeagueInput {
  season: string;
  name: string;
  nation: string;
  // Presenti solo se il logo va aggiunto/sostituito (null = rimuovi). Se assenti il logo resta invariato.
  logoData?: Prisma.LeagueUncheckedCreateInput['logoData'];
  logoMimeType?: string | null;
  hasLogo?: boolean;
}

// Campi da non restituire mai nelle risposte (contengono il binario)
export const LEAGUE_OMIT_BLOB = { logoData: true } as const;

export { isAdminRequest };

// Valida e normalizza i dati di un campionato.
// La nazione deve già esistere nella tabella Nation: viene salvato il suo nome
// (stringa), senza duplicare altri dati della nazione.
export async function parseLeagueInput(
  body: unknown
): Promise<{ ok: true; data: LeagueInput } | { ok: false; error: string }> {
  const raw = (body ?? {}) as Record<string, unknown>;
  const clean = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

  const season = clean(raw.season);
  const name = clean(raw.name);
  const nation = clean(raw.nation);

  if (!season || !name || !nation) {
    return { ok: false, error: 'Stagione, campionato e nazione sono obbligatori' };
  }
  if (season.length > 50 || name.length > 100) {
    return { ok: false, error: 'Stagione o campionato troppo lunghi' };
  }

  // Logo: base64 (senza prefisso data:) + mime type. "removeLogo: true" lo elimina.
  const logoFields: Pick<LeagueInput, 'logoData' | 'logoMimeType' | 'hasLogo'> = {};
  if (raw.removeLogo === true) {
    logoFields.logoData = null;
    logoFields.logoMimeType = null;
    logoFields.hasLogo = false;
  } else if (raw.logoData !== undefined && raw.logoData !== null && raw.logoData !== '') {
    const mime = clean(raw.logoMimeType);
    if (typeof raw.logoData !== 'string' || !/^image\/[a-z0-9.+-]+$/i.test(mime)) {
      return { ok: false, error: 'Il logo deve essere un file immagine valido' };
    }
    const buffer = Buffer.from(raw.logoData, 'base64');
    if (buffer.length === 0) {
      return { ok: false, error: 'Il logo deve essere un file immagine valido' };
    }
    if (buffer.length > MAX_LOGO_BYTES) {
      return { ok: false, error: 'Il logo è troppo grande (massimo 2 MB)' };
    }
    logoFields.logoData = buffer;
    logoFields.logoMimeType = mime;
    logoFields.hasLogo = true;
  }

  const existingNation = await db.nation.findUnique({ where: { name: nation } });
  if (!existingNation) {
    return { ok: false, error: 'La nazione selezionata non esiste tra le nazionalità' };
  }

  return { ok: true, data: { season, name, nation: existingNation.name, ...logoFields } };
}

// Valida il campionato scelto per un kit: vuoto/null = nessun campionato,
// altrimenti deve esistere nella tabella League.
// Restituisce anche la stagione del campionato: la stagione del kit (Kit.name)
// viene sempre allineata a quella del suo campionato.
export async function resolveLeagueId(
  value: unknown
): Promise<{ ok: true; leagueId: string | null; season: string | null } | { ok: false; error: string }> {
  if (value === undefined || value === null || value === '') {
    return { ok: true, leagueId: null, season: null };
  }
  if (typeof value !== 'string') {
    return { ok: false, error: 'Campionato non valido' };
  }
  const league = await db.league.findUnique({ where: { id: value }, select: { id: true, season: true } });
  if (!league) {
    return { ok: false, error: 'Il campionato selezionato non esiste' };
  }
  return { ok: true, leagueId: league.id, season: league.season };
}

// Errore Prisma di violazione del vincolo di unicità
export function isUniqueViolation(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === 'P2002';
}
