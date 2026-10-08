import { NextRequest, NextResponse } from 'next/server';
import { createAuthToken, verifyAuthToken } from '@/lib/auth';
import { getClientIp, getLoginStatus, recordLoginFailure, resetLoginFailures } from '@/lib/login-limiter';

export { verifyAuthToken };

// POST /api/admin/login - Login admin
export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);

    // Troppi tentativi falliti: blocco temporaneo (anche con le credenziali giuste)
    const status = getLoginStatus(ip);
    if (status.locked) {
      return NextResponse.json(
        { error: 'Troppi tentativi falliti. Riprova più tardi.', ...status },
        { status: 429, headers: { 'Retry-After': String(status.retryAfterSeconds) } }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    // Verifica credenziali
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username !== adminUsername || password !== adminPassword) {
      const after = recordLoginFailure(ip);
      if (after.locked) {
        return NextResponse.json(
          { error: 'Troppi tentativi falliti. Riprova più tardi.', ...after },
          { status: 429, headers: { 'Retry-After': String(after.retryAfterSeconds) } }
        );
      }
      return NextResponse.json(
        { error: 'Credenziali non valide', ...after },
        { status: 401 }
      );
    }

    resetLoginFailures(ip);

    // Genera token di autenticazione
    const token = createAuthToken();

    // Restituisci il token al client (verrà salvato in localStorage)
    return NextResponse.json({ 
      success: true, 
      message: 'Login effettuato con successo',
      token 
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    );
  }
}

// GET /api/admin/login - Verifica stato login
export async function GET(request: NextRequest) {
  try {
    // Token dall'header Authorization (consigliato); il parametro ?token= resta per compatibilità
    const header = request.headers.get('authorization') || '';
    const token = header.startsWith('Bearer ')
      ? header.slice(7).trim()
      : new URL(request.url).searchParams.get('token');

    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
