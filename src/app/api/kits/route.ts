import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per generare un ID
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// GET /api/kits - Ottieni tutti i kit
export async function GET() {
  try {
    console.log('GET /api/kits - Starting');
    const kits = await db.kit.findMany({
      orderBy: [
        { team: 'asc' },
        { type: 'asc' },
      ],
      select: {
        id: true,
        name: true,
        team: true,
        type: true,
        createdAt: true,
        updatedAt: true,
        likes: true,
        dislikes: true,
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
      },
    });

    console.log('GET /api/kits - Success, found', kits.length, 'kits');
    return NextResponse.json(kits);
  } catch (error) {
    console.error('Error fetching kits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kits', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST /api/kits - Crea un nuovo kit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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

    if (!name || !team || !type) {
      return NextResponse.json(
        { error: 'Name, team, and type are required' },
        { status: 400 }
      );
    }

    // Converte base64 in Buffer se presente
    const kit = await db.kit.create({
      data: {
        id: generateId(),
        name,
        team,
        type,
        // Imposta i flag in base alla presenza dei dati
        hasImage: !!imageData,
        hasLogo: !!logoData,
        hasModel3D: !!model3DData,
        hasDetail1: !!detail1Data,
        hasDetail2: !!detail2Data,
        hasDetail3: !!detail3Data,
        hasDetail4: !!detail4Data,
        hasDetail5: !!detail5Data,
        hasDetail6: !!detail6Data,
        // Dati binari
        imageData: imageData ? Buffer.from(imageData, 'base64') : null,
        imageMimeType: imageMimeType || null,
        logoData: logoData ? Buffer.from(logoData, 'base64') : null,
        logoMimeType: logoMimeType || null,
        model3DData: model3DData ? Buffer.from(model3DData, 'base64') : null,
        model3DName: model3DName || null,
        detail1Data: detail1Data ? Buffer.from(detail1Data, 'base64') : null,
        detail1MimeType: detail1MimeType || null,
        detail1Label: detail1Label || null,
        detail2Data: detail2Data ? Buffer.from(detail2Data, 'base64') : null,
        detail2MimeType: detail2MimeType || null,
        detail2Label: detail2Label || null,
        detail3Data: detail3Data ? Buffer.from(detail3Data, 'base64') : null,
        detail3MimeType: detail3MimeType || null,
        detail3Label: detail3Label || null,
        detail4Data: detail4Data ? Buffer.from(detail4Data, 'base64') : null,
        detail4MimeType: detail4MimeType || null,
        detail4Label: detail4Label || null,
        detail5Data: detail5Data ? Buffer.from(detail5Data, 'base64') : null,
        detail5MimeType: detail5MimeType || null,
        detail5Label: detail5Label || null,
        detail6Data: detail6Data ? Buffer.from(detail6Data, 'base64') : null,
        detail6MimeType: detail6MimeType || null,
        detail6Label: detail6Label || null,
        updatedAt: new Date(),
      },
    });

    // Restituisci il kit senza i dati binari
    const { imageData: _, logoData: __, model3DData: ___, detail1Data: d1, detail2Data: d2, detail3Data: d3, detail4Data: d4, detail5Data: d5, detail6Data: d6, ...kitWithoutBinary } = kit;

    return NextResponse.json(kitWithoutBinary, { status: 201 });
  } catch (error) {
    console.error('Error creating kit:', error);
    return NextResponse.json(
      { error: 'Failed to create kit', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
