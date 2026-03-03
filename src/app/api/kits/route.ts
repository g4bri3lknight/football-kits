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

    if (!name || !team || !type) {
      return NextResponse.json(
        { error: 'Name, team, and type are required' },
        { status: 400 }
      );
    }

    // Convert empty strings to null for optional fields
    const kit = await db.kit.create({
      data: {
        id: generateId(),
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

    return NextResponse.json(kit, { status: 201 });
  } catch (error) {
    console.error('Error creating kit:', error);
    return NextResponse.json(
      { error: 'Failed to create kit' },
      { status: 500 }
    );
  }
}
