import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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

// GET - Ottieni la configurazione del viewer 3D
export async function GET() {
  try {
    let config = await db.viewer3DConfig.findUnique({
      where: { id: 'viewer3d-config' }
    });

    // Se non esiste, crea la configurazione di default
    if (!config) {
      config = await db.viewer3DConfig.create({
        data: { id: 'viewer3d-config' }
      });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching viewer3d config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch viewer3d config' },
      { status: 500 }
    );
  }
}

// PUT - Aggiorna la configurazione del viewer 3D
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminToken, ...configData } = body;

    // Verifica il token admin
    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json({ 
        error: 'Sessione scaduta', 
        details: 'La tua sessione è scaduta. Effettua nuovamente il login.' 
      }, { status: 401 });
    }

    // Aggiorna o crea la configurazione
    const config = await db.viewer3DConfig.upsert({
      where: { id: 'viewer3d-config' },
      update: configData,
      create: {
        id: 'viewer3d-config',
        ...configData
      }
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating viewer3d config:', error);
    return NextResponse.json(
      { error: 'Failed to update viewer3d config' },
      { status: 500 }
    );
  }
}
