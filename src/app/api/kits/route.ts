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

    if (!body.name || !body.team || !body.type) {
      console.error('POST /api/kits - Validation failed:', { name: body.name, team: body.team, type: body.type });
      return NextResponse.json(
        { error: 'Name, team, and type are required', received: { name: body.name, team: body.team, type: body.type } },
        { status: 400 }
      );
    }

    // Build create data: only include fields actually sent by the client
    const data: Record<string, any> = {
      id: generateId(),
      name: body.name,
      team: body.team,
      type: body.type,
      updatedAt: new Date(),
    };

    // Status (optional, defaults to NON_IMPOSTATO)
    if (body.status) {
      data.status = body.status;
    }

    // Binary fields: only include if the client actually sent them
    if (body.imageData) {
      data.hasImage = true;
      data.imageData = Buffer.from(body.imageData, 'base64');
      data.imageMimeType = body.imageMimeType || null;
    }
    if (body.logoData) {
      data.hasLogo = true;
      data.logoData = Buffer.from(body.logoData, 'base64');
      data.logoMimeType = body.logoMimeType || null;
    }
    if (body.model3DData) {
      data.hasModel3D = true;
      data.model3DData = Buffer.from(body.model3DData, 'base64');
      data.model3DName = body.model3DName || null;
    }
    if (body.detail1Data) {
      data.hasDetail1 = true;
      data.detail1Data = Buffer.from(body.detail1Data, 'base64');
      data.detail1MimeType = body.detail1MimeType || null;
      data.detail1Label = body.detail1Label || null;
    }
    if (body.detail2Data) {
      data.hasDetail2 = true;
      data.detail2Data = Buffer.from(body.detail2Data, 'base64');
      data.detail2MimeType = body.detail2MimeType || null;
      data.detail2Label = body.detail2Label || null;
    }
    if (body.detail3Data) {
      data.hasDetail3 = true;
      data.detail3Data = Buffer.from(body.detail3Data, 'base64');
      data.detail3MimeType = body.detail3MimeType || null;
      data.detail3Label = body.detail3Label || null;
    }
    if (body.detail4Data) {
      data.hasDetail4 = true;
      data.detail4Data = Buffer.from(body.detail4Data, 'base64');
      data.detail4MimeType = body.detail4MimeType || null;
      data.detail4Label = body.detail4Label || null;
    }
    if (body.detail5Data) {
      data.hasDetail5 = true;
      data.detail5Data = Buffer.from(body.detail5Data, 'base64');
      data.detail5MimeType = body.detail5MimeType || null;
      data.detail5Label = body.detail5Label || null;
    }
    if (body.detail6Data) {
      data.hasDetail6 = true;
      data.detail6Data = Buffer.from(body.detail6Data, 'base64');
      data.detail6MimeType = body.detail6MimeType || null;
      data.detail6Label = body.detail6Label || null;
    }

    const kit = await db.kit.create({ data });

    return NextResponse.json(sanitizeKit(kit), { status: 201 });
  } catch (error) {
    console.error('Error creating kit:', error);
    return NextResponse.json(
      { error: 'Failed to create kit', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
