import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

// GET - Lista tutti i preset
export async function GET() {
  try {
    const presets = await db.viewer3DPreset.findMany({
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        config: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(presets);
  } catch (error) {
    console.error('Error fetching presets:', error);
    return NextResponse.json({ error: 'Failed to fetch presets' }, { status: 500 });
  }
}

// POST - Crea un nuovo preset
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminToken, name, config } = body;

    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    if (!name || !config) {
      return NextResponse.json({ error: 'Nome e configurazione sono obbligatori' }, { status: 400 });
    }

    const preset = await db.viewer3DPreset.create({
      data: { name, config: JSON.stringify(config) },
    });

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Error creating preset:', error);
    return NextResponse.json({ error: 'Failed to create preset' }, { status: 500 });
  }
}

// Import preset da JSON
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminToken, name, config } = body;

    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    if (!name || !config) {
      return NextResponse.json({ error: 'Nome e configurazione sono obbligatori' }, { status: 400 });
    }

    const preset = await db.viewer3DPreset.create({
      data: { name, config: typeof config === 'string' ? config : JSON.stringify(config) },
    });

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Error importing preset:', error);
    return NextResponse.json({ error: 'Failed to import preset' }, { status: 500 });
  }
}
