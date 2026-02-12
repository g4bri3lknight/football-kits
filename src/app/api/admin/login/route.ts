import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// Token semplice basato su timestamp + secret
function generateAuthToken(): string {
  const timestamp = Date.now();
  const secret = process.env.ADMIN_SECRET || 'default-secret-change-this';
  return Buffer.from(`${timestamp}:${secret}`).toString('base64');
}

// Verifica se il token è valido
function verifyAuthToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestamp, secret] = decoded.split(':');

    // Verifica secret
    if (secret !== (process.env.ADMIN_SECRET || 'default-secret-change-this')) {
      return false;
    }

    // Verifica che il token non sia più vecchio di 24 ore
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 ore

    return tokenAge < maxAge;
  } catch {
    return false;
  }
}

// POST /api/admin/login - Login admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Verifica credenziali
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Genera token di autenticazione
    const token = generateAuthToken();

    // Imposta cookie di sessione
    const cookieStore = await cookies();
    cookieStore.set('admin-session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 ore
      path: '/',
    });

    return NextResponse.json({ success: true, message: 'Login effettuato con successo' });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json(
      { error: 'Errore durante il login' },
      { status: 500 }
    );
  }
}

// GET /api/admin/login - Verifica stato login
export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin-session')?.value;

    if (!sessionToken || !verifyAuthToken(sessionToken)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
