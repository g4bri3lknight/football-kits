import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Recupera statistiche visite
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    let dateFilter: Date | null = null;
    
    if (period === 'today') {
      dateFilter = new Date();
      dateFilter.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      dateFilter = new Date();
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (period === 'month') {
      dateFilter = new Date();
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    }

    const whereClause = dateFilter
      ? { createdAt: { gte: dateFilter } }
      : {};

    // Conteggio totale
    const totalViews = await db.pageView.count({
      where: whereClause,
    });

    // Visite per pagina
    const viewsByPage = await db.pageView.groupBy({
      by: ['page'],
      where: whereClause,
      _count: {
        page: true,
      },
    });

    // Visite per giorno (ultimi 30 giorni)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const viewsByDay = await db.pageView.groupBy({
      by: ['createdAt'],
      where: {
        ...whereClause,
        createdAt: { gte: thirtyDaysAgo },
      },
      _count: {
        page: true,
      },
    });

    // Raggruppa per giorno
    const dailyStats: { [key: string]: number } = {};
    viewsByDay.forEach((view) => {
      const day = view.createdAt.toISOString().split('T')[0];
      dailyStats[day] = (dailyStats[day] || 0) + view._count.page;
    });

    return NextResponse.json({
      totalViews,
      viewsByPage: viewsByPage.map(v => ({
        page: v.page,
        count: v._count.page,
      })),
      dailyStats: Object.entries(dailyStats)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
    });
  } catch (error) {
    console.error('Error fetching page views:', error);
    return NextResponse.json({ error: 'Failed to fetch page views' }, { status: 500 });
  }
}

// POST - Registra una nuova visita
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { page } = body;

    if (!page) {
      return NextResponse.json({ error: 'Page is required' }, { status: 400 });
    }

    // Ottieni informazioni dalla richiesta
    const userAgent = request.headers.get('user-agent') || undefined;
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined;

    const pageView = await db.pageView.create({
      data: {
        page,
        userAgent,
        ip,
      },
    });

    return NextResponse.json(pageView, { status: 201 });
  } catch (error) {
    console.error('Error creating page view:', error);
    return NextResponse.json({ error: 'Failed to create page view' }, { status: 500 });
  }
}

// DELETE - Resetta tutte le statistiche
export async function DELETE() {
  try {
    await db.pageView.deleteMany();
    
    return NextResponse.json({ 
      success: true, 
      message: 'Tutte le statistiche sono state azzerate' 
    });
  } catch (error) {
    console.error('Error resetting page views:', error);
    return NextResponse.json({ error: 'Failed to reset page views' }, { status: 500 });
  }
}
