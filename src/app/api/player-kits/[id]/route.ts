import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Kit fields senza dati binari (Bytes)
const kitSelectWithoutBinary = {
  id: true,
  name: true,
  team: true,
  type: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  hasImage: true,
  hasLogo: true,
  hasModel3D: true,
  hasDetail1: true,
  hasDetail2: true,
  hasDetail3: true,
  hasDetail4: true,
  hasDetail5: true,
  hasDetail6: true,
  detail1Label: true,
  detail2Label: true,
  detail3Label: true,
  detail4Label: true,
  detail5Label: true,
  detail6Label: true,
  likes: true,
  dislikes: true,
} as const;

// Player fields senza dati binari (Bytes)
const playerSelectWithoutBinary = {
  id: true,
  name: true,
  surname: true,
  nationId: true,
  biography: true,
  createdAt: true,
  updatedAt: true,
  hasImage: true,
  status: true,
  Nation: true,
} as const;

// PUT /api/player-kits/[id] - Aggiorna un'associazione player-kit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { playerId, kitId } = body;

    // Check if association exists
    const existingAssociation = await db.playerKit.findUnique({
      where: { id },
    });

    if (!existingAssociation) {
      return NextResponse.json(
        { error: 'Association not found' },
        { status: 404 }
      );
    }

    // Check for duplicate association
    if (playerId && kitId) {
      const duplicate = await db.playerKit.findFirst({
        where: {
          AND: [
            { playerId },
            { kitId },
            { id: { not: id } },
          ],
        },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'Association already exists' },
          { status: 409 }
        );
      }
    }

    // Update association
    const updatedAssociation = await db.playerKit.update({
      where: { id },
      data: {
        ...(playerId !== undefined && { playerId }),
        ...(kitId !== undefined && { kitId }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        playerId: true,
        kitId: true,
        createdAt: true,
        updatedAt: true,
        Player: {
          select: playerSelectWithoutBinary,
        },
        Kit: {
          select: kitSelectWithoutBinary,
        },
      },
    });

    return NextResponse.json(updatedAssociation);
  } catch (error) {
    console.error('Error updating player kit:', error);
    return NextResponse.json(
      { error: 'Failed to update player kit association' },
      { status: 500 }
    );
  }
}

// DELETE /api/player-kits/[id] - Elimina un'associazione player-kit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.playerKit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Player kit association deleted successfully' });
  } catch (error) {
    console.error('Error deleting player kit:', error);
    return NextResponse.json(
      { error: 'Failed to delete player kit association' },
      { status: 500 }
    );
  }
}
