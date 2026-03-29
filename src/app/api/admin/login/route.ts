import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthToken } from '@/lib/auth';

export { verifyAuthToken };

// Token semplice basato su timestamp + secret
function generateAuthToken(): string {
  const timestamp = Date.now();
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SECRET non configurato');
  }
  return Buffer.from(`${timestamp}:${secret}`).toString('base64');
}

// POST /api/admin/login - Login admin
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Verifica credenziali
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';

    if (username !== adminUsername || password !== adminPassword) {
      return NextResponse.json(
        { error: 'Credenziali non valide' },
        { status: 401 }
      );
    }

    // Genera token di autenticazione
    const token = generateAuthToken();

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
    // Leggi il token dall'URL query parameter
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || !verifyAuthToken(token)) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
  } catch (error) {
    console.error('Error checking auth:', error);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}
