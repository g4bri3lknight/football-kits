import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

// POST - Applica preset a più kit (bulk apply)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminToken, kitIds } = body;

    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    if (!kitIds || !Array.isArray(kitIds) || kitIds.length === 0) {
      return NextResponse.json({ error: 'Seleziona almeno un kit' }, { status: 400 });
    }

    // Recupera il preset
    const preset = await db.viewer3DPreset.findUnique({ where: { id } });
    if (!preset) {
      return NextResponse.json({ error: 'Preset non trovato' }, { status: 404 });
    }

    // Parse config dal preset
    const configData = JSON.parse(preset.config);

    // Rimuovi campi che non appartengono a KitViewer3DConfig
    const { id: _id, kitId: _kitId, updatedAt: _updatedAt, ...kitConfigData } = configData;

    // Applica a tutti i kit selezionati in parallelo
    const results = await Promise.allSettled(
      kitIds.map((kitId: string) =>
        db.kitViewer3DConfig.upsert({
          where: { kitId },
          update: kitConfigData,
          create: { kitId, ...kitConfigData },
        })
      )
    );

    const applied = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      applied,
      failed,
      total: kitIds.length,
    });
  } catch (error) {
    console.error('Error applying preset:', error);
    return NextResponse.json({ error: 'Failed to apply preset' }, { status: 500 });
  }
}
