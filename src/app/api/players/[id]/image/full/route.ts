import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/players/[id]/image/full - Foto intera del giocatore (figura intera/mezzobusto)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await db.player.findUnique({
      where: { id },
      select: {
        fullImageData: true,
        fullImageMimeType: true,
      },
    });

    if (!player || !player.fullImageData) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Con ?t=<updatedAt> l'URL cambia a ogni modifica, quindi la cache lunga è sicura
    const cacheControl = request.nextUrl.searchParams.has('t')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache';

    return new NextResponse(player.fullImageData, {
      status: 200,
      headers: {
        'Content-Type': player.fullImageMimeType || 'image/jpeg',
        'Cache-Control': cacheControl,
      },
    });
  } catch (error) {
    console.error('Error fetching full player image:', error);
    return NextResponse.json({ error: 'Failed to fetch player image' }, { status: 500 });
  }
}
