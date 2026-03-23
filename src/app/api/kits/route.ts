import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per generare un ID
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// Funzione helper per rimuovere i dati binari dalla risposta
const sanitizeKit = (kit: any) => {
  const { imageData, logoData, model3DData, detail1Data, detail2Data, detail3Data, detail4Data, detail5Data, detail6Data, ...rest } = kit;
  return rest;
};

// GET /api/kits - Ottieni tutti i kit
export async function GET() {
  try {
    console.log('GET /api/kits - Starting');
    const kits = await db.kit.findMany({
      select: {
        id: true,
        name: true,
        team: true,
        type: true,
        likes: true,
        dislikes: true,
        updatedAt: true,
        status: true,
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
      orderBy: [
        { team: 'asc' },
        { type: 'asc' },
      ],
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
    console.log('POST /api/kits - Request body keys:', Object.keys(body));
    console.log('POST /api/kits - name:', body.name, 'team:', body.team, 'type:', body.type);
    
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
      status,
    } = body;

    if (!name || !team || !type) {
      console.error('POST /api/kits - Validation failed:', { name, team, type });
      return NextResponse.json(
        { error: 'Name, team, and type are required', received: { name, team, type } },
        { status: 400 }
      );
    }

    const kit = await db.kit.create({
      data: {
        id: generateId(),
        name,
        team,
        type,
        // Immagine principale
        hasImage: !!imageData,
        imageData: imageData ? Buffer.from(imageData, 'base64') : null,
        imageMimeType: imageMimeType || null,
        // Logo
        hasLogo: !!logoData,
        logoData: logoData ? Buffer.from(logoData, 'base64') : null,
        logoMimeType: logoMimeType || null,
        // Modello 3D
        hasModel3D: !!model3DData,
        model3DData: model3DData ? Buffer.from(model3DData, 'base64') : null,
        model3DName: model3DName || null,
        // Dettagli
        hasDetail1: !!detail1Data,
        detail1Data: detail1Data ? Buffer.from(detail1Data, 'base64') : null,
        detail1MimeType: detail1MimeType || null,
        detail1Label: detail1Label || null,
        hasDetail2: !!detail2Data,
        detail2Data: detail2Data ? Buffer.from(detail2Data, 'base64') : null,
        detail2MimeType: detail2MimeType || null,
        detail2Label: detail2Label || null,
        hasDetail3: !!detail3Data,
        detail3Data: detail3Data ? Buffer.from(detail3Data, 'base64') : null,
        detail3MimeType: detail3MimeType || null,
        detail3Label: detail3Label || null,
        hasDetail4: !!detail4Data,
        detail4Data: detail4Data ? Buffer.from(detail4Data, 'base64') : null,
        detail4MimeType: detail4MimeType || null,
        detail4Label: detail4Label || null,
        hasDetail5: !!detail5Data,
        detail5Data: detail5Data ? Buffer.from(detail5Data, 'base64') : null,
        detail5MimeType: detail5MimeType || null,
        detail5Label: detail5Label || null,
        hasDetail6: !!detail6Data,
        detail6Data: detail6Data ? Buffer.from(detail6Data, 'base64') : null,
        detail6MimeType: detail6MimeType || null,
        detail6Label: detail6Label || null,
        status: status || 'NON_IMPOSTATO',
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(sanitizeKit(kit), { status: 201 });
  } catch (error) {
    console.error('Error creating kit:', error);
    return NextResponse.json(
      { error: 'Failed to create kit' },
      { status: 500 }
    );
  }
}
