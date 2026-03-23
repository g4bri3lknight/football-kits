import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione helper per generare un ID
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// Funzione helper per rimuovere i dati binari dalla risposta
const sanitizePlayerKit = (playerKit: any) => {
  return {
    ...playerKit,
    Player: playerKit.Player ? {
      ...playerKit.Player,
      hasImage: !!playerKit.Player.imageData,
      imageData: undefined,
      imageMimeType: undefined,
    } : null,
    Kit: playerKit.Kit ? {
      ...playerKit.Kit,
      hasImage: !!playerKit.Kit.imageData,
      hasLogo: !!playerKit.Kit.logoData,
      hasModel3D: !!playerKit.Kit.model3DData,
      hasDetail1: !!playerKit.Kit.detail1Data,
      hasDetail2: !!playerKit.Kit.detail2Data,
      hasDetail3: !!playerKit.Kit.detail3Data,
      hasDetail4: !!playerKit.Kit.detail4Data,
      hasDetail5: !!playerKit.Kit.detail5Data,
      hasDetail6: !!playerKit.Kit.detail6Data,
      imageData: undefined,
      imageMimeType: undefined,
      logoData: undefined,
      logoMimeType: undefined,
      model3DData: undefined,
      model3DName: undefined,
      detail1Data: undefined,
      detail1MimeType: undefined,
      detail2Data: undefined,
      detail2MimeType: undefined,
      detail3Data: undefined,
      detail3MimeType: undefined,
      detail4Data: undefined,
      detail4MimeType: undefined,
      detail5Data: undefined,
      detail5MimeType: undefined,
      detail6Data: undefined,
      detail6MimeType: undefined,
    } : null,
  };
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

    // Rimuovi i dati binari prima di inviare la risposta
    const sanitizedPlayerKits = playerKits.map(sanitizePlayerKit);
    return NextResponse.json(sanitizedPlayerKits);
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

    return NextResponse.json(sanitizePlayerKit(playerKit), { status: 201 });
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
