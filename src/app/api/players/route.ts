import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Force dynamic rendering to avoid caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Funzione helper per generare un ID
const generateId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 15);
  return `${timestamp}${randomStr}`;
};

// Funzione helper per rimuovere i dati binari dalla risposta
const sanitizePlayer = (player: any) => {
  const { imageData, ...rest } = player;
  return {
    ...rest,
    hasImage: !!imageData,
  };
};

// GET /api/players - Ottieni tutti i giocatori
export async function GET() {
  console.log('GET /api/players called');
  try {
    const players = await db.player.findMany({
      select: {
        id: true,
        name: true,
        surname: true,
        nationId: true,
        biography: true,
        updatedAt: true,
        hasImage: true,
        status: true,
        Nation: true,
        PlayerKit: {
          select: {
            id: true,
            playerId: true,
            kitId: true,
            Kit: {
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
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: [
        { name: 'asc' },
        { surname: 'asc' },
      ],
    });

    return NextResponse.json(players);
  } catch (error) {
    console.error('Error fetching players:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to fetch players', details: errorMessage },
      { status: 500 }
    );
  }
}

// POST /api/players - Crea un nuovo giocatore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, surname, nationId, imageData, imageMimeType, biography, status } = body;

    if (!name || !surname) {
      return NextResponse.json(
        { error: 'Nome e cognome sono obbligatori' },
        { status: 400 }
      );
    }

    // Verifica se esiste già un player con lo stesso nome, cognome e nazionalità
    const existingPlayer = await db.player.findFirst({
      where: {
        name: name.trim(),
        surname: surname.trim(),
        nationId: nationId || null,
      },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Esiste già un giocatore con lo stesso nome, cognome e nazionalità' },
        { status: 409 }
      );
    }

    const player = await db.player.create({
      data: {
        id: generateId(),
        name: name.trim(),
        surname: surname.trim(),
        nationId: nationId || null,
        hasImage: !!imageData,
        imageData: imageData ? Buffer.from(imageData, 'base64') : null,
        imageMimeType: imageMimeType || null,
        biography: biography || null,
        status: status || 'NON_IMPOSTATO',
        updatedAt: new Date(),
      },
      include: {
        Nation: true,
      },
    });

    return NextResponse.json(sanitizePlayer(player), { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
