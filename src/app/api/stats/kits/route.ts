import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    // Ottieni statistiche generali
    const totalKits = await db.kit.count();
    
    const likesSum = await db.kit.aggregate({
      _sum: {
        likes: true,
      },
    });
    
    const dislikesSum = await db.kit.aggregate({
      _sum: {
        dislikes: true,
      },
    });

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
      },
    });

    // Ottieni tutti i kit per calcolare i più votati
    const allKits = await db.kit.findMany({
      select: {
        id: true,
        name: true,
        team: true,
        type: true,
        likes: true,
        dislikes: true,
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
        totalLikes: likesSum._sum.likes || 0,
        totalDislikes: dislikesSum._sum.dislikes || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching kit stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit stats', details: String(error) },
      { status: 500 }
    );
  }
}
