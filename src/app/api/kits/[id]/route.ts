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
            Player: true,
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
    console.log('Update kit request body:', JSON.stringify(body, null, 2));
    
    const {
      name,
      team,
      type,
      imageUrl,
      model3DUrl,
      logoUrl,
      detail1Url,
      detail2Url,
      detail3Url,
      detail4Url,
      detail5Url,
      detail6Url,
      detail1Label,
      detail2Label,
      detail3Label,
      detail4Label,
      detail5Label,
      detail6Label,
    } = body;

    // Convert empty strings to null for optional fields
    const kit = await db.kit.update({
      where: { id },
      data: {
        name,
        team,
        type,
        imageUrl: imageUrl || null,
        model3DUrl: model3DUrl || null,
        logoUrl: logoUrl || null,
        detail1Url: detail1Url || null,
        detail2Url: detail2Url || null,
        detail3Url: detail3Url || null,
        detail4Url: detail4Url || null,
        detail5Url: detail5Url || null,
        detail6Url: detail6Url || null,
        detail1Label: detail1Label || null,
        detail2Label: detail2Label || null,
        detail3Label: detail3Label || null,
        detail4Label: detail4Label || null,
        detail5Label: detail5Label || null,
        detail6Label: detail6Label || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(kit);
  } catch (error) {
    console.error('Error updating kit:', error);
    return NextResponse.json(
      { error: 'Failed to update kit', details: error instanceof Error ? error.message : String(error) },
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
