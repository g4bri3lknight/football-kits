import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

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
    const { adminToken, id, updatedAt, ...configData } = body;

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
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to update viewer3d config', details: message },
      { status: 500 }
    );
  }
}
