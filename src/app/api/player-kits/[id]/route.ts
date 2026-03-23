import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
      include: {
        Player: {
          include: {
            Nation: true,
          },
        },
        Kit: true,
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
