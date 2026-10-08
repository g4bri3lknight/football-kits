import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

// Funzione helper per rimuovere i dati binari dalla risposta
const sanitizePlayer = (player: any) => {
  const { imageData, fullImageData, ...rest } = player;
  return {
    ...rest,
    hasImage: !!imageData,
    hasFullImage: !!fullImageData,
  };
};

// Legge e valida le coordinate del ritaglio (frazioni 0..1 della larghezza della foto intera)
const num = (v: any) => (typeof v === 'number' && isFinite(v) ? Math.max(0, Math.min(v, 10)) : null);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = requireAdmin(request);
  if (denied) return denied;

  try {
    const { id } = await params;
    const body = await request.json();

    console.log('PUT /api/players/[id] - Update request:', { id, body: { ...body, imageData: body.imageData ? '[BLOB]' : undefined, fullImageData: body.fullImageData ? '[BLOB]' : undefined } });

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

    // Build update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    // Update basic fields if provided
    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.surname !== undefined) updateData.surname = body.surname.trim();
    if (body.nationId !== undefined) updateData.nationId = body.nationId || null;
    if (body.biography !== undefined) updateData.biography = body.biography || null;
    if (body.status !== undefined) updateData.status = body.status;

    // Update image if provided
    if (body.imageData !== undefined) {
      updateData.imageData = body.imageData ? Buffer.from(body.imageData, 'base64') : null;
      updateData.imageMimeType = body.imageMimeType || null;
      updateData.hasImage = !!body.imageData;
      // Senza miniatura non può esistere nemmeno la foto intera
      if (!body.imageData) {
        updateData.hasFullImage = false;
        updateData.fullImageData = null;
        updateData.fullImageMimeType = null;
        updateData.cropX = null;
        updateData.cropY = null;
        updateData.cropSize = null;
      }
    }

    // Foto intera + ritaglio del volto: fullImageData null/'' la rimuove, un valore la sostituisce.
    // Se arrivano solo le coordinate (ritaglio corretto senza ricaricare la foto) si aggiornano quelle.
    if (body.fullImageData !== undefined && (body.imageData === undefined || body.imageData)) {
      if (body.fullImageData) {
        updateData.fullImageData = Buffer.from(body.fullImageData, 'base64');
        updateData.fullImageMimeType = body.fullImageMimeType || 'image/jpeg';
        updateData.hasFullImage = true;
      } else {
        updateData.fullImageData = null;
        updateData.fullImageMimeType = null;
        updateData.hasFullImage = false;
        updateData.cropX = null;
        updateData.cropY = null;
        updateData.cropSize = null;
      }
    }
    if (body.cropX !== undefined && updateData.hasFullImage !== false && (updateData.hasFullImage === true || existingPlayer.hasFullImage)) {
      updateData.cropX = num(body.cropX);
      updateData.cropY = num(body.cropY);
      updateData.cropSize = num(body.cropSize);
    }

    const updatedPlayer = await db.player.update({
      where: { id },
      data: updateData,
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
  const denied = requireAdmin(request);
  if (denied) return denied;

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
