import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per rimuovere i dati binari dalla risposta
const sanitizePlayer = (player: any) => {
  const { imageData, ...rest } = player;
  return {
    ...rest,
    hasImage: !!imageData,
  };
};

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('PUT /api/players/[id] - Update request:', { id, bodyKeys: Object.keys(body) });

    // Check if player exists
    const existingPlayer = await db.player.findUnique({
      where: { id },
    });

    if (!existingPlayer) {
      console.log('Player not found with id:', id);
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Build update data object
    const data: any = {
      updatedAt: new Date(),
    };

    if (body.name !== undefined) data.name = body.name.trim();
    if (body.surname !== undefined) data.surname = body.surname.trim();
    if (body.nationId !== undefined) {
      data.nationId = body.nationId === '' ? null : body.nationId;
    }
    if (body.biography !== undefined) {
      data.biography = body.biography === '' ? null : body.biography;
    }

    // Gestione immagine BLOB
    if (body.imageData !== undefined) {
      data.imageData = body.imageData ? Buffer.from(body.imageData, 'base64') : null;
      data.imageMimeType = body.imageMimeType || null;
      data.hasImage = !!body.imageData;
    }

    console.log('Updating player with data keys:', Object.keys(data));

    const updatedPlayer = await db.player.update({
      where: { id },
      data,
      include: {
        Nation: true,
      },
    });

    console.log('Player updated successfully:', updatedPlayer.id);
    return NextResponse.json(sanitizePlayer(updatedPlayer));
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if player exists
    const existingPlayer = await db.player.findUnique({
      where: { id },
    });

    if (!existingPlayer) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    // Delete player (cascade will handle player-kit relationships)
    await db.player.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Player deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
