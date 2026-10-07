import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LEAGUE_OMIT_BLOB, isAdminRequest, isUniqueViolation, parseLeagueInput } from '@/lib/leagues';

// PUT - Modifica un campionato (solo admin)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Sessione scaduta o non autorizzata' }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Body non valido' }, { status: 400 });
  }

  try {
    const { id } = await params;

    const existing = await db.league.findUnique({ where: { id }, select: { id: true } });
    if (!existing) {
      return NextResponse.json({ error: 'Campionato non trovato' }, { status: 404 });
    }

    const parsed = await parseLeagueInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    // La stagione dei kit coincide con quella del campionato: aggiorna campionato e kit insieme
    const [league] = await db.$transaction([
      db.league.update({ where: { id }, data: parsed.data, omit: LEAGUE_OMIT_BLOB }),
      db.kit.updateMany({ where: { leagueId: id }, data: { name: parsed.data.season } }),
    ]);
    return NextResponse.json(league);
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: 'Esiste già un campionato con la stessa stagione, nome e nazione' },
        { status: 409 }
      );
    }
    console.error('Error updating league:', error);
    return NextResponse.json({ error: 'Failed to update league' }, { status: 500 });
  }
}

// DELETE - Elimina un campionato (solo admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: 'Sessione scaduta o non autorizzata' }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await db.league.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Campionato non trovato' }, { status: 404 });
    }

    await db.league.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting league:', error);
    return NextResponse.json({ error: 'Failed to delete league' }, { status: 500 });
  }
}
