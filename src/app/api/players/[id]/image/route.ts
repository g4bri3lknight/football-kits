import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/players/[id]/image - Ottieni l'immagine del giocatore
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await db.player.findUnique({
      where: { id },
      select: {
        imageData: true,
        imageMimeType: true,
      },
    });

    if (!player || !player.imageData) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return new NextResponse(player.imageData, {
      status: 200,
      headers: {
        'Content-Type': player.imageMimeType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching player image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player image' },
      { status: 500 }
    );
  }
}
