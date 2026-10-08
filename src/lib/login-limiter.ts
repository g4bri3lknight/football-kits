import type { NextRequest } from 'next/server';

// Limite ai tentativi di login falliti, per indirizzo IP.
// Dopo MAX_ATTEMPTS errori il login è bloccato per LOCK_MS; il blocco e il
// contatore vivono in memoria: si azzerano al riavvio del server.
export const MAX_ATTEMPTS = 10;
const LOCK_MS = 15 * 60 * 1000;      // durata del blocco
const FORGET_MS = 15 * 60 * 1000;    // senza nuovi errori per questo tempo il contatore riparte da zero

type Entry = { failures: number; lastFailure: number; lockedUntil: number };

const globalStore = globalThis as unknown as { __loginAttempts?: Map<string, Entry> };
const store = (globalStore.__loginAttempts ??= new Map<string, Entry>());

// IP del client. Dietro un reverse proxy (es. Caddy) arriva in X-Forwarded-For.
export function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim() || 'unknown';
  return request.headers.get('x-real-ip')?.trim() || 'unknown';
}

export interface LoginStatus {
  maxAttempts: number;
  attemptsLeft: number;
  locked: boolean;
  retryAfterSeconds: number;
}

export function getLoginStatus(ip: string): LoginStatus {
  const now = Date.now();
  const entry = store.get(ip);

  if (entry && entry.lockedUntil > now) {
    return {
      maxAttempts: MAX_ATTEMPTS,
      attemptsLeft: 0,
      locked: true,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }
  // Blocco scaduto o errori vecchi: ripartenza da zero
  if (entry && (entry.lockedUntil > 0 || now - entry.lastFailure > FORGET_MS)) {
    store.delete(ip);
    return { maxAttempts: MAX_ATTEMPTS, attemptsLeft: MAX_ATTEMPTS, locked: false, retryAfterSeconds: 0 };
  }
  return {
    maxAttempts: MAX_ATTEMPTS,
    attemptsLeft: MAX_ATTEMPTS - (entry?.failures ?? 0),
    locked: false,
    retryAfterSeconds: 0,
  };
}

// Registra un tentativo fallito e restituisce lo stato aggiornato
export function recordLoginFailure(ip: string): LoginStatus {
  const now = Date.now();
  getLoginStatus(ip); // pulisce eventuali voci scadute
  const entry = store.get(ip) ?? { failures: 0, lastFailure: now, lockedUntil: 0 };
  entry.failures += 1;
  entry.lastFailure = now;
  if (entry.failures >= MAX_ATTEMPTS) entry.lockedUntil = now + LOCK_MS;
  store.set(ip, entry);

  // Evita che la mappa cresca all'infinito
  if (store.size > 5000) {
    for (const [key, value] of store) {
      if (value.lockedUntil < now && now - value.lastFailure > FORGET_MS) store.delete(key);
    }
  }
  return getLoginStatus(ip);
}

export function resetLoginFailures(ip: string): void {
  store.delete(ip);
}
