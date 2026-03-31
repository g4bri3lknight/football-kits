import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/kits/[id]/model3d - Ottieni il modello 3D del kit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        model3DData: true,
        model3DName: true,
      },
    });

    if (!kit || !kit.model3DData) {
      return NextResponse.json(
        { error: '3D model not found' },
        { status: 404 }
      );
    }

    // Cache breve o niente: il modello può essere aggiornato dall'admin
    // Il client aggiunge un cache buster (?v=...) per forzare il refresh
    const cacheControl = request.nextUrl.searchParams.has('v')
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=60';

    return new NextResponse(kit.model3DData, {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `inline; filename="${kit.model3DName || 'model.glb'}"`,
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('Error fetching kit 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit 3D model' },
      { status: 500 }
    );
  }
}
