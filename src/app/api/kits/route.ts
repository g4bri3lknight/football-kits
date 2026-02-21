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
    const kits = await db.kit.findMany({
      orderBy: [
        { team: 'asc' },
        { type: 'asc' },
      ],
    });

    return NextResponse.json(kits);
  } catch (error) {
    console.error('Error fetching kits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kits' },
      { status: 500 }
    );
  }
}

// POST /api/kits - Crea un nuovo kit
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, team, type, imageUrl, model3DUrl, logoUrl } = body;

    if (!name || !team || !type) {
      return NextResponse.json(
        { error: 'Name, team, and type are required' },
        { status: 400 }
      );
    }

    const kit = await db.kit.create({
      data: {
        id: generateId(),
        name,
        team,
        type,
        imageUrl,
        model3DUrl,
        logoUrl,
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
