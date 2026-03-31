import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

// GET - Singolo preset
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const preset = await db.viewer3DPreset.findUnique({ where: { id } });

    if (!preset) {
      return NextResponse.json({ error: 'Preset non trovato' }, { status: 404 });
    }

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Error fetching preset:', error);
    return NextResponse.json({ error: 'Failed to fetch preset' }, { status: 500 });
  }
}

// PUT - Aggiorna preset
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminToken, name, config } = body;

    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    const updateData: any = {};
    if (name) updateData.name = name;
    if (config) updateData.config = JSON.stringify(config);

    const preset = await db.viewer3DPreset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(preset);
  } catch (error) {
    console.error('Error updating preset:', error);
    return NextResponse.json({ error: 'Failed to update preset' }, { status: 500 });
  }
}

// DELETE - Elimina preset
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const adminToken = body.adminToken;

    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    await db.viewer3DPreset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting preset:', error);
    return NextResponse.json({ error: 'Failed to delete preset' }, { status: 500 });
  }
}
