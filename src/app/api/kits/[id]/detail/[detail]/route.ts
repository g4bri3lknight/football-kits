import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      1: { data: 'detail1Data', mimeType: 'detail1MimeType' },
      2: { data: 'detail2Data', mimeType: 'detail2MimeType' },
      3: { data: 'detail3Data', mimeType: 'detail3MimeType' },
      4: { data: 'detail4Data', mimeType: 'detail4MimeType' },
      5: { data: 'detail5Data', mimeType: 'detail5MimeType' },
      6: { data: 'detail6Data', mimeType: 'detail6MimeType' },
    } as const;

    const fields = selectField[detailNum as keyof typeof selectField];
    
    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        [fields.data]: true,
        [fields.mimeType]: true,
      },
    });

    // @ts-ignore - dynamic field access
    if (!kit || !kit[fields.data]) {
      return NextResponse.json({ error: 'Detail image not found' }, { status: 404 });
    }

    // @ts-ignore - dynamic field access
    const buffer = Buffer.from(kit[fields.data]);
    // @ts-ignore - dynamic field access
    const mimeType = kit[fields.mimeType] || 'image/png';
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching kit detail image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit detail image' },
      { status: 500 }
    );
  }
}
