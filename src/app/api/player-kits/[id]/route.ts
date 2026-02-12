import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
