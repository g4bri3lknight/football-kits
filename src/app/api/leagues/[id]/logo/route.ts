import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/leagues/[id]/logo - Ottieni il logo del campionato
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const league = await db.league.findUnique({
      where: { id },
      select: {
        logoData: true,
        logoMimeType: true,
      },
    });

    if (!league || !league.logoData) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    return new NextResponse(league.logoData, {
      status: 200,
      headers: {
        'Content-Type': league.logoMimeType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching league logo:', error);
    return NextResponse.json({ error: 'Failed to fetch league logo' }, { status: 500 });
  }
}
