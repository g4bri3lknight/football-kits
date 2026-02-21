import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/kits/[id] - Ottieni un kit specifico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kit = await db.kit.findUnique({
      where: { id },
      include: {
        PlayerKit: {
          include: {
            player: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!kit) {
      return NextResponse.json(
        { error: 'Kit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(kit);
  } catch (error) {
    console.error('Error fetching kit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit' },
      { status: 500 }
    );
  }
}

// PUT /api/kits/[id] - Aggiorna un kit
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, team, type, imageUrl, model3DUrl, logoUrl } = body;

    const kit = await db.kit.update({
      where: { id },
      data: {
        name,
        team,
        type,
        imageUrl,
        model3DUrl,
        logoUrl,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(kit);
  } catch (error) {
    console.error('Error updating kit:', error);
    return NextResponse.json(
      { error: 'Failed to update kit' },
      { status: 500 }
    );
  }
}

// DELETE /api/kits/[id] - Elimina un kit
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.kit.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Kit deleted successfully' });
  } catch (error) {
    console.error('Error deleting kit:', error);
    return NextResponse.json(
      { error: 'Failed to delete kit' },
      { status: 500 }
    );
  }
}
