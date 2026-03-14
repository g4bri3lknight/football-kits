import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per rimuovere i dati binari dalla risposta
const sanitizeKit = (kit: any) => {
  const { imageData, logoData, model3DData, detail1Data, detail2Data, detail3Data, detail4Data, detail5Data, detail6Data, ...rest } = kit;
  // I flag hasImage, hasLogo, ecc. sono già nel database
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
      include: {
        PlayerKit: {
          include: {
            Player: {
              include: {
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

    return NextResponse.json(sanitizeKit(kit));
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
      // Nuovi campi BLOB
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

    // Costruisci l'oggetto data dinamicamente
    const data: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) data.name = name;
    if (team !== undefined) data.team = team;
    if (type !== undefined) data.type = type;

    // Gestione dei dati binari (se forniti) + aggiornamento flag
    if (imageData !== undefined) {
      data.imageData = imageData ? Buffer.from(imageData, 'base64') : null;
      data.imageMimeType = imageMimeType || null;
      data.hasImage = !!imageData;
    }
    if (logoData !== undefined) {
      data.logoData = logoData ? Buffer.from(logoData, 'base64') : null;
      data.logoMimeType = logoMimeType || null;
      data.hasLogo = !!logoData;
    }
    if (model3DData !== undefined) {
      data.model3DData = model3DData ? Buffer.from(model3DData, 'base64') : null;
      data.model3DName = model3DName || null;
      data.hasModel3D = !!model3DData;
    }

    // Dettagli
    if (detail1Data !== undefined) {
      data.detail1Data = detail1Data ? Buffer.from(detail1Data, 'base64') : null;
      data.detail1MimeType = detail1MimeType || null;
      data.hasDetail1 = !!detail1Data;
    }
    if (detail1Label !== undefined) data.detail1Label = detail1Label || null;

    if (detail2Data !== undefined) {
      data.detail2Data = detail2Data ? Buffer.from(detail2Data, 'base64') : null;
      data.detail2MimeType = detail2MimeType || null;
      data.hasDetail2 = !!detail2Data;
    }
    if (detail2Label !== undefined) data.detail2Label = detail2Label || null;

    if (detail3Data !== undefined) {
      data.detail3Data = detail3Data ? Buffer.from(detail3Data, 'base64') : null;
      data.detail3MimeType = detail3MimeType || null;
      data.hasDetail3 = !!detail3Data;
    }
    if (detail3Label !== undefined) data.detail3Label = detail3Label || null;

    if (detail4Data !== undefined) {
      data.detail4Data = detail4Data ? Buffer.from(detail4Data, 'base64') : null;
      data.detail4MimeType = detail4MimeType || null;
      data.hasDetail4 = !!detail4Data;
    }
    if (detail4Label !== undefined) data.detail4Label = detail4Label || null;

    if (detail5Data !== undefined) {
      data.detail5Data = detail5Data ? Buffer.from(detail5Data, 'base64') : null;
      data.detail5MimeType = detail5MimeType || null;
      data.hasDetail5 = !!detail5Data;
    }
    if (detail5Label !== undefined) data.detail5Label = detail5Label || null;

    if (detail6Data !== undefined) {
      data.detail6Data = detail6Data ? Buffer.from(detail6Data, 'base64') : null;
      data.detail6MimeType = detail6MimeType || null;
      data.hasDetail6 = !!detail6Data;
    }
    if (detail6Label !== undefined) data.detail6Label = detail6Label || null;

    const kit = await db.kit.update({
      where: { id },
      data,
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
