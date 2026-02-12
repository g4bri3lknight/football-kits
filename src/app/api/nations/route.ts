import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    const nations = await db.nation.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { code: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(nations);
  } catch (error) {
    console.error('Error fetching nations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch nations' },
      { status: 500 }
    );
  }
}
