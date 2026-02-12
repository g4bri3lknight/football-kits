import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/players - Ottieni tutti i giocatori
export async function GET() {
  console.log('GET /api/players called');
  try {
    const players = await db.player.findMany({
      include: {
        nation: true,
        PlayerKit: {
          include: {
            kit: true,
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
    return NextResponse.json(
      { error: 'Failed to fetch players' },
      { status: 500 }
    );
  }
}

// POST /api/players - Crea un nuovo giocatore
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, surname, nationId, image } = body;

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
        name: name.trim(),
        surname: surname.trim(),
        nationId: nationId || null,
        image,
      },
      include: {
        nation: true,
      },
    });

    return NextResponse.json(player, { status: 201 });
  } catch (error) {
    console.error('Error creating player:', error);
    return NextResponse.json(
      { error: 'Failed to create player' },
      { status: 500 }
    );
  }
}
