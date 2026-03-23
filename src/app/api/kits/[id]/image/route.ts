import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/kits/[id]/image - Ottieni l'immagine principale del kit
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        imageData: true,
        imageMimeType: true,
      },
    });

    if (!kit || !kit.imageData) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return new NextResponse(kit.imageData, {
      status: 200,
      headers: {
        'Content-Type': kit.imageMimeType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching kit image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit image' },
      { status: 500 }
    );
  }
}
