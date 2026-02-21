import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per generare un ID
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// GET /api/player-kits - Ottieni tutte le associazioni player-kit
export async function GET() {
  try {
    const playerKits = await db.playerKit.findMany({
      include: {
        Player: {
          include: {
            Nation: true,
          },
        },
        Kit: true,
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
      include: {
        Player: {
          include: {
            Nation: true,
          },
        },
        Kit: true,
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
