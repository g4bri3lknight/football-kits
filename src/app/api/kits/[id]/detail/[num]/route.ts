import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/kits/[id]/detail/[num] - Ottieni un'immagine dettaglio del kit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; num: string }> }
) {
  try {
    const { id, num } = await params;
    const detailNum = parseInt(num, 10);

    if (isNaN(detailNum) || detailNum < 1 || detailNum > 6) {
      return NextResponse.json(
        { error: 'Invalid detail number. Must be 1-6.' },
        { status: 400 }
      );
    }

    const selectFields: Record<number, { data: string; mimeType: string }> = {
      1: { data: 'detail1Data', mimeType: 'detail1MimeType' },
      2: { data: 'detail2Data', mimeType: 'detail2MimeType' },
      3: { data: 'detail3Data', mimeType: 'detail3MimeType' },
      4: { data: 'detail4Data', mimeType: 'detail4MimeType' },
      5: { data: 'detail5Data', mimeType: 'detail5MimeType' },
      6: { data: 'detail6Data', mimeType: 'detail6MimeType' },
    };

    const field = selectFields[detailNum];
    if (!field) {
      return NextResponse.json(
        { error: 'Invalid detail number' },
        { status: 400 }
      );
    }

    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        [field.data]: true,
        [field.mimeType]: true,
      },
    });

    if (!kit) {
      return NextResponse.json(
        { error: 'Kit not found' },
        { status: 404 }
      );
    }

    const detailData = (kit as any)[field.data];
    const detailMimeType = (kit as any)[field.mimeType];

    if (!detailData) {
      return NextResponse.json(
        { error: 'Detail image not found' },
        { status: 404 }
      );
    }

    return new NextResponse(detailData, {
      status: 200,
      headers: {
        'Content-Type': detailMimeType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching kit detail:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit detail' },
      { status: 500 }
    );
  }
}
