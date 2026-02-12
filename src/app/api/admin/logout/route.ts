import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// POST /api/admin/logout - Logout admin
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('admin-session');

    return NextResponse.json({ success: true, message: 'Logout effettuato con successo' });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json(
      { error: 'Errore durante il logout' },
      { status: 500 }
    );
  }
}
