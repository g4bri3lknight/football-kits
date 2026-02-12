import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/player-kits - Ottieni tutte le associazioni player-kit
export async function GET() {
  try {
    const playerKits = await db.playerKit.findMany({
      include: {
        player: true,
        kit: true,
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
        playerId,
        kitId,
      },
      include: {
        player: true,
        kit: true,
      },
    });

    return NextResponse.json(playerKit, { status: 201 });
  } catch (error: any) {
    console.error('Error creating player kit:', error);
    
    // Handle unique constraint violation
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'Questa associazione esiste già' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create player kit association' },
      { status: 500 }
    );
  }
}
