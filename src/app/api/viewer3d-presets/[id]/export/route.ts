import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

// GET - Esporta preset come JSON scaricabile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminToken = request.nextUrl.searchParams.get('adminToken');

    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    const preset = await db.viewer3DPreset.findUnique({ where: { id } });
    if (!preset) {
      return NextResponse.json({ error: 'Preset non trovato' }, { status: 404 });
    }

    // Crea oggetto esportabile
    const exportData = {
      presetVersion: 1,
      name: preset.name,
      exportedAt: new Date().toISOString(),
      config: JSON.parse(preset.config),
    };

    // Response come file scaricabile
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="preset-${preset.name.replace(/[^a-zA-Z0-9]/g, '_')}.json"`,
      },
    });
  } catch (error) {
    console.error('Error exporting preset:', error);
    return NextResponse.json({ error: 'Failed to export preset' }, { status: 500 });
  }
}
