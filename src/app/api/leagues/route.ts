import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { LEAGUE_OMIT_BLOB, isAdminRequest, isUniqueViolation, parseLeagueInput } from '@/lib/leagues';

// GET - Lista dei campionati (stagioni più recenti per prime)
export async function GET() {
  try {
    const leagues = await db.league.findMany({
      orderBy: [{ season: 'desc' }, { name: 'asc' }],
      omit: LEAGUE_OMIT_BLOB,
    });
    return NextResponse.json(leagues);
  } catch (error) {
    console.error('Error fetching leagues:', error);
    return NextResponse.json({ error: 'Failed to fetch leagues' }, { status: 500 });
  }
}

// POST - Crea un campionato (solo admin)
export async function POST(request: NextRequest) {
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
    const parsed = await parseLeagueInput(body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const league = await db.league.create({ data: parsed.data, omit: LEAGUE_OMIT_BLOB });
    return NextResponse.json(league, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json(
        { error: 'Esiste già un campionato con la stessa stagione, nome e nazione' },
        { status: 409 }
      );
    }
    console.error('Error creating league:', error);
    return NextResponse.json({ error: 'Failed to create league' }, { status: 500 });
  }
}
