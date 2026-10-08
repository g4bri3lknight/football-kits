import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/kits/[id]/detail/[detail]/model3d - Ottieni il modello 3D di un dettaglio del kit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; detail: string }> }
) {
  try {
    const { id, detail } = await params;
    const detailNum = parseInt(detail, 10);

    if (isNaN(detailNum) || detailNum < 1 || detailNum > 6) {
      return NextResponse.json({ error: 'Invalid detail number' }, { status: 400 });
    }

    const selectField = {
      1: { data: 'detail1Model3DData', name: 'detail1Model3DName' },
      2: { data: 'detail2Model3DData', name: 'detail2Model3DName' },
      3: { data: 'detail3Model3DData', name: 'detail3Model3DName' },
      4: { data: 'detail4Model3DData', name: 'detail4Model3DName' },
      5: { data: 'detail5Model3DData', name: 'detail5Model3DName' },
      6: { data: 'detail6Model3DData', name: 'detail6Model3DName' },
    } as const;

    const fields = selectField[detailNum as keyof typeof selectField];

    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        [fields.data]: true,
        [fields.name]: true,
      },
    });

    const kitRow = kit as Record<string, any> | null;
    if (!kitRow || !kitRow[fields.data]) {
      return NextResponse.json({ error: 'Detail 3D model not found' }, { status: 404 });
    }

    const cacheControl = request.nextUrl.searchParams.has('v')
      ? 'no-cache, no-store, must-revalidate'
      : 'public, max-age=60';

    return new NextResponse(kitRow[fields.data], {
      status: 200,
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `inline; filename="${kitRow[fields.name] || 'detail-model.glb'}"`,
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('Error fetching detail 3D model:', error);
    return NextResponse.json(
      { error: 'Failed to fetch detail 3D model' },
      { status: 500 }
    );
  }
}
