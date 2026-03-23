import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Istanzia PrismaClient direttamente per evitare problemi di cache
const prisma = new PrismaClient();

// Verifica se il token admin è valido (stessa logica del login)
function verifyAuthToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 2) return false;
    
    const timestamp = parts[0];
    const secret = parts[1];

    // Verifica secret - deve corrispondere esattamente a ADMIN_SECRET
    const validSecret = process.env.ADMIN_SECRET;
    if (!validSecret || secret !== validSecret) {
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

// GET - Ottieni il nickname dell'admin
export async function GET() {
  try {
    let admin = await prisma.admin.findUnique({
      where: { id: 'admin' }
    });

    // Se non esiste, crealo
    if (!admin) {
      admin = await prisma.admin.create({
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

    const admin = await prisma.admin.upsert({
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
