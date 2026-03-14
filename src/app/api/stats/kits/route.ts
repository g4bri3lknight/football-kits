import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Ottieni i kit ordinati per likes (top 5)
    const topLiked = await db.kit.findMany({
      where: {
        likes: { gt: 0 },
      },
      orderBy: {
        likes: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        team: true,
        type: true,
        likes: true,
        dislikes: true,
        imageUrl: true,
        logoUrl: true,
      },
    });

    // Ottieni i kit ordinati per dislikes (top 5)
    const topDisliked = await db.kit.findMany({
      where: {
        dislikes: { gt: 0 },
      },
      orderBy: {
        dislikes: 'desc',
      },
      take: 5,
      select: {
        id: true,
        name: true,
        team: true,
        type: true,
        likes: true,
        dislikes: true,
        imageUrl: true,
        logoUrl: true,
      },
    });

    // Ottieni statistiche generali
    const totalKits = await db.kit.count();
    const totalLikes = await db.kit.aggregate({
      _sum: {
        likes: true,
      },
    });
    const totalDislikes = await db.kit.aggregate({
      _sum: {
        dislikes: true,
      },
    });

    // Kit più controversi (più votati in assoluto)
    const allKits = await db.kit.findMany({
      select: {
        id: true,
        name: true,
        team: true,
        type: true,
        likes: true,
        dislikes: true,
        imageUrl: true,
        logoUrl: true,
      },
    });

    // Ordina per totale voti
    const mostVoted = allKits
      .sort((a, b) => (b.likes + b.dislikes) - (a.likes + a.dislikes))
      .slice(0, 5);

    return NextResponse.json({
      topLiked,
      topDisliked,
      mostVoted,
      summary: {
        totalKits,
        totalLikes: totalLikes._sum.likes || 0,
        totalDislikes: totalDislikes._sum.dislikes || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching kit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit stats' },
      { status: 500 }
    );
  }
}
