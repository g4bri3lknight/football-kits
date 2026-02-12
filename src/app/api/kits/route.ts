import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

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
        name,
        team,
        type,
        imageUrl,
        model3DUrl,
        logoUrl,
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
