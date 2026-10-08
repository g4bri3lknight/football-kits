import { createHmac, timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

// Confronto a tempo costante per non rivelare il secret tramite i tempi di risposta
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 ore

function sign(expiresAt: string, secret: string): string {
  return createHmac('sha256', secret).update(expiresAt).digest('hex');
}

// Crea un token di sessione firmato: "<scadenza>.<firma HMAC-SHA256>".
// Il token NON contiene il segreto: senza ADMIN_SECRET non si può falsificare.
export function createAuthToken(): string {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SECRET non configurato');
  }
  const expiresAt = String(Date.now() + TOKEN_TTL_MS);
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

// Verifica firma e scadenza del token admin
export function verifyAuthToken(token: string): boolean {
  try {
    const secret = process.env.ADMIN_SECRET;
    if (!secret || typeof token !== 'string') return false;

    const [expiresAt, signature, ...rest] = token.split('.');
    if (!expiresAt || !signature || rest.length > 0 || !/^\d+$/.test(expiresAt)) return false;

    if (!safeEqual(signature, sign(expiresAt, secret))) return false;

    const remaining = Number(expiresAt) - Date.now();
    return remaining > 0 && remaining <= TOKEN_TTL_MS;
  } catch {
    return false;
  }
}

// Verifica che la richiesta contenga un token admin valido (header "Authorization: Bearer <token>")
export function isAdminRequest(request: NextRequest): boolean {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  return !!token && verifyAuthToken(token);
}

// Da usare all'inizio degli handler riservati all'admin:
//   const denied = requireAdmin(request); if (denied) return denied;
// Restituisce la risposta 401 se manca un token valido, altrimenti null.
export function requireAdmin(request: NextRequest): NextResponse | null {
  if (isAdminRequest(request)) return null;
  return NextResponse.json(
    { error: 'Non autorizzato', details: 'Sessione scaduta o mancante: effettua di nuovo il login.' },
    { status: 401 }
  );
}
