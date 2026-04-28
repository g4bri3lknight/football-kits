import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per generare un ID
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// Kit fields senza dati binari (Bytes)
const kitSelectWithoutBinary = {
  id: true,
  name: true,
  team: true,
  type: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  hasImage: true,
  hasLogo: true,
  hasModel3D: true,
  hasDetail1: true,
  hasDetail2: true,
  hasDetail3: true,
  hasDetail4: true,
  hasDetail5: true,
  hasDetail6: true,
  detail1Label: true,
  detail2Label: true,
  detail3Label: true,
  detail4Label: true,
  detail5Label: true,
  detail6Label: true,
  likes: true,
  dislikes: true,
} as const;

// Player fields senza dati binari (Bytes)
const playerSelectWithoutBinary = {
  id: true,
  name: true,
  surname: true,
  nationId: true,
  biography: true,
  createdAt: true,
  updatedAt: true,
  hasImage: true,
  status: true,
  Nation: true,
} as const;

// GET /api/player-kits - Ottieni tutte le associazioni player-kit
export async function GET() {
  try {
    const playerKits = await db.playerKit.findMany({
      select: {
        id: true,
        playerId: true,
        kitId: true,
        createdAt: true,
        updatedAt: true,
        Player: {
          select: playerSelectWithoutBinary,
        },
        Kit: {
          select: kitSelectWithoutBinary,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(playerKits);
  } catch (error) {
    console.error('Error fetching player kits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player kits' },
      { status: 500 }
    );
  }
}

// POST /api/player-kits - Associa un kit a un giocatore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { playerId, kitId } = body;

    if (!playerId || !kitId) {
      return NextResponse.json(
        { error: 'Player ID and kit ID are required' },
        { status: 400 }
      );
    }

    // Check if association already exists
    const existingAssociation = await db.playerKit.findUnique({
      where: {
        playerId_kitId: {
          playerId,
          kitId,
        },
      },
    });

    if (existingAssociation) {
      return NextResponse.json(
        { error: 'Questa associazione esiste già' },
        { status: 409 }
      );
    }

    const playerKit = await db.playerKit.create({
      data: {
        id: generateId(),
        playerId,
        kitId,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        playerId: true,
        kitId: true,
        createdAt: true,
        updatedAt: true,
        Player: {
          select: playerSelectWithoutBinary,
        },
        Kit: {
          select: kitSelectWithoutBinary,
        },
      },
    });

    return NextResponse.json(playerKit, { status: 201 });
  } catch (error: any) {
    console.error('Error creating player kit:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });

    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Questa associazione esiste già' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create player kit association' },
      { status: 500 }
    );
  }
}
