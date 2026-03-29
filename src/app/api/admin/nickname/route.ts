import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

// GET - Ottieni il nickname dell'admin
export async function GET() {
  try {
    let admin = await db.admin.findUnique({
      where: { id: 'admin' }
    });

    // Se non esiste, crealo
    if (!admin) {
      admin = await db.admin.create({
        data: { id: 'admin' }
      });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error fetching admin nickname:', error);
    return NextResponse.json({ error: 'Failed to fetch admin nickname' }, { status: 500 });
  }
}

// PUT - Aggiorna il nickname dell'admin
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { nickname, adminToken } = body;

    // Verifica il token admin
    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json({
        error: 'Sessione scaduta',
        details: 'La tua sessione è scaduta. Effettua nuovamente il login.'
      }, { status: 401 });
    }

    // Valida il nickname
    if (nickname && nickname.length > 50) {
      return NextResponse.json({ error: 'Nickname too long (max 50 characters)' }, { status: 400 });
    }

    const admin = await db.admin.upsert({
      where: { id: 'admin' },
      update: { nickname: nickname || null },
      create: { id: 'admin', nickname: nickname || null }
    });

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Error updating admin nickname:', error);
    return NextResponse.json({ error: 'Failed to update admin nickname', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}
