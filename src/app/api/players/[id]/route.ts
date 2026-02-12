import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/players/[id] - Ottieni un giocatore specifico
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const player = await db.player.findUnique({
      where: { id },
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
    });

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error fetching player:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player' },
      { status: 500 }
    );
  }
}

// PUT /api/players/[id] - Aggiorna un giocatore
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, surname, nationId, image } = body;

    if (!name || !surname) {
      return NextResponse.json(
        { error: 'Nome e cognome sono obbligatori' },
        {status: 400 }
      );
    }

    // Verifica se esiste già un player diverso con lo stesso nome, cognome e nazionalità
    const existingPlayer = await db.player.findFirst({
      where: {
        name: name.trim(),
        surname: surname.trim(),
        nationId: nationId || null,
        id: { not: id }, // Esclude il player che si sta modificando
      },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: 'Esiste già un giocatore con lo stesso nome, cognome e nazionalità' },
        { status: 409 }
      );
    }

    const player = await db.player.update({
      where: { id },
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

    return NextResponse.json(player);
  } catch (error) {
    console.error('Error updating player:', error);
    return NextResponse.json(
      { error: 'Failed to update player' },
      {status: 500 }
    );
  }
}

// DELETE /api/players/[id] - Elimina un giocatore
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.player.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Player deleted successfully' });
  } catch (error) {
    console.error('Error deleting player:', error);
    return NextResponse.json(
      { error: 'Failed to delete player' },
      { status: 500 }
    );
  }
}
