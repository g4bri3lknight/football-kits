import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per rimuovere i dati binari dalla risposta
const sanitizeKit = (kit: any) => {
  const { imageData, logoData, model3DData, detail1Data, detail2Data, detail3Data, detail4Data, detail5Data, detail6Data, ...rest } = kit;
  return rest;
};

// GET /api/kits/[id] - Ottieni un kit specifico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        team: true,
        type: true,
        likes: true,
        dislikes: true,
        updatedAt: true,
        // Flag per la presenza di file
        hasImage: true,
        hasLogo: true,
        hasModel3D: true,
        hasDetail1: true,
        hasDetail2: true,
        hasDetail3: true,
        hasDetail4: true,
        hasDetail5: true,
        hasDetail6: true,
        // Labels dei dettagli
        detail1Label: true,
        detail2Label: true,
        detail3Label: true,
        detail4Label: true,
        detail5Label: true,
        detail6Label: true,
        PlayerKit: {
          select: {
            id: true,
            playerId: true,
            kitId: true,
            Player: {
              select: {
                id: true,
                name: true,
                surname: true,
                nationId: true,
                hasImage: true,
                Nation: true,
              },
            },
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
    console.log('Update kit request body keys:', Object.keys(body));
    
    const {
      name,
      team,
      type,
      imageData,
      imageMimeType,
      logoData,
      logoMimeType,
      model3DData,
      model3DName,
      detail1Data,
      detail1MimeType,
      detail1Label,
      detail2Data,
      detail2MimeType,
      detail2Label,
      detail3Data,
      detail3MimeType,
      detail3Label,
      detail4Data,
      detail4MimeType,
      detail4Label,
      detail5Data,
      detail5MimeType,
      detail5Label,
      detail6Data,
      detail6MimeType,
      detail6Label,
    } = body;

    // Build update data object
    const updateData: any = {
      name,
      team,
      type,
      updatedAt: new Date(),
    };

    // Aggiungi solo i campi che sono stati forniti (per non sovrascrivere i dati esistenti)
    if (imageData !== undefined) {
      updateData.hasImage = !!imageData;
      updateData.imageData = imageData ? Buffer.from(imageData, 'base64') : null;
      updateData.imageMimeType = imageMimeType || null;
    }
    if (logoData !== undefined) {
      updateData.hasLogo = !!logoData;
      updateData.logoData = logoData ? Buffer.from(logoData, 'base64') : null;
      updateData.logoMimeType = logoMimeType || null;
    }
    if (model3DData !== undefined) {
      updateData.hasModel3D = !!model3DData;
      updateData.model3DData = model3DData ? Buffer.from(model3DData, 'base64') : null;
      updateData.model3DName = model3DName || null;
    }
    if (detail1Data !== undefined) {
      updateData.hasDetail1 = !!detail1Data;
      updateData.detail1Data = detail1Data ? Buffer.from(detail1Data, 'base64') : null;
      updateData.detail1MimeType = detail1MimeType || null;
    }
    if (detail2Data !== undefined) {
      updateData.hasDetail2 = !!detail2Data;
      updateData.detail2Data = detail2Data ? Buffer.from(detail2Data, 'base64') : null;
      updateData.detail2MimeType = detail2MimeType || null;
    }
    if (detail3Data !== undefined) {
      updateData.hasDetail3 = !!detail3Data;
      updateData.detail3Data = detail3Data ? Buffer.from(detail3Data, 'base64') : null;
      updateData.detail3MimeType = detail3MimeType || null;
    }
    if (detail4Data !== undefined) {
      updateData.hasDetail4 = !!detail4Data;
      updateData.detail4Data = detail4Data ? Buffer.from(detail4Data, 'base64') : null;
      updateData.detail4MimeType = detail4MimeType || null;
    }
    if (detail5Data !== undefined) {
      updateData.hasDetail5 = !!detail5Data;
      updateData.detail5Data = detail5Data ? Buffer.from(detail5Data, 'base64') : null;
      updateData.detail5MimeType = detail5MimeType || null;
    }
    if (detail6Data !== undefined) {
      updateData.hasDetail6 = !!detail6Data;
      updateData.detail6Data = detail6Data ? Buffer.from(detail6Data, 'base64') : null;
      updateData.detail6MimeType = detail6MimeType || null;
    }

    // Labels can always be updated
    if (detail1Label !== undefined) updateData.detail1Label = detail1Label || null;
    if (detail2Label !== undefined) updateData.detail2Label = detail2Label || null;
    if (detail3Label !== undefined) updateData.detail3Label = detail3Label || null;
    if (detail4Label !== undefined) updateData.detail4Label = detail4Label || null;
    if (detail5Label !== undefined) updateData.detail5Label = detail5Label || null;
    if (detail6Label !== undefined) updateData.detail6Label = detail6Label || null;

    const kit = await db.kit.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(sanitizeKit(kit));
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
