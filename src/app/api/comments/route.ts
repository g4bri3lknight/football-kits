import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Ottieni tutti i commenti
export async function GET() {
  try {
    const comments = await db.comment.findMany({
      include: {
        Kit: {
          select: {
            id: true,
            name: true,
            team: true,
            type: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST - Crea un nuovo commento
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { author, content, kitId } = body;

    if (!author || !content || author.trim() === '' || content.trim() === '') {
      return NextResponse.json({ error: 'Author and content are required' }, { status: 400 });
    }

    const comment = await db.comment.create({
      data: {
        author: author.trim(),
        content: content.trim(),
        kitId: kitId || null,
      },
      include: {
        Kit: {
          select: {
            id: true,
            name: true,
            team: true,
            type: true,
          }
        }
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 });
  }
}
