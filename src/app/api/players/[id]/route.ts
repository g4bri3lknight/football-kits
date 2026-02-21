import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    console.log('PUT /api/players/[id] - Update request:', { id, body });

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

    // Update player - build data object explicitly
    const data: any = {
      ...(body.name !== undefined && { name: body.name }),
      ...(body.surname !== undefined && { surname: body.surname }),
      ...(body.nationId !== undefined && {
        nationId: body.nationId === '' ? null : body.nationId,
      }),
      ...(body.image !== undefined && { image: body.image }),
      ...(body.biography !== undefined && {
        biography: body.biography === '' ? null : body.biography,
      }),
      updatedAt: new Date(),
    };

    console.log('Updating player with data:', data);

    const updatedPlayer = await db.player.update({
      where: { id },
      data,
      include: {
        Nation: true,
      },
    });

    console.log('Player updated successfully:', updatedPlayer.id);
    return NextResponse.json(updatedPlayer);
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
