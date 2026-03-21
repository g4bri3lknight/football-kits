import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verifica se il token admin è valido (stessa logica del login)
function verifyAuthToken(token: string): boolean {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split(':');
    if (parts.length !== 2) return false;
    
    const timestamp = parts[0];
    const secret = parts[1];

    // Verifica secret - deve corrispondere esattamente a ADMIN_SECRET
    const validSecret = process.env.ADMIN_SECRET;
    if (!validSecret || secret !== validSecret) {
      return false;
    }

    // Verifica che il token non sia più vecchio di 24 ore
    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 ore

    return tokenAge < maxAge;
  } catch {
    return false;
  }
}

// GET - Ottieni tutti i commenti con risposte
export async function GET() {
  try {
    // Prendi solo i commenti principali (senza parentId)
    const comments = await db.comment.findMany({
      where: {
        parentId: null, // Solo commenti principali
      },
      include: {
        Kit: {
          select: {
            id: true,
            name: true,
            team: true,
            type: true,
          }
        },
        Replies: {
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
            createdAt: 'asc'
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

// POST - Crea un nuovo commento o risposta
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { author, content, kitId, parentId, userId } = body;

    if (!author || !content || author.trim() === '' || content.trim() === '') {
      return NextResponse.json({ error: 'Author and content are required' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Se è una risposta, verifica che il commento padre esista
    if (parentId) {
      const parentComment = await db.comment.findUnique({
        where: { id: parentId }
      });

      if (!parentComment) {
        return NextResponse.json({ error: 'Parent comment not found' }, { status: 404 });
      }

      // Le risposte non possono avere risposte (massimo 2 livelli)
      if (parentComment.parentId) {
        return NextResponse.json({ error: 'Cannot reply to a reply' }, { status: 400 });
      }
    }

    const comment = await db.comment.create({
      data: {
        author: author.trim(),
        content: content.trim(),
        userId,
        kitId: kitId || null,
        parentId: parentId || null,
      },
      include: {
        Kit: {
          select: {
            id: true,
            name: true,
            team: true,
            type: true,
          }
        },
        Replies: true,
      }
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json({ error: 'Failed to create comment', details: String(error) }, { status: 500 });
  }
}

// PUT - Modifica un commento esistente (solo l'autore)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, content, userId } = body;

    if (!id || !content || !userId) {
      return NextResponse.json({ error: 'ID, content and userId are required' }, { status: 400 });
    }

    // Verifica che il commento esista e appartenga all'utente
    const existingComment = await db.comment.findUnique({
      where: { id }
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    if (existingComment.userId !== userId) {
      return NextResponse.json({ error: 'You can only edit your own comments' }, { status: 403 });
    }

    const updatedComment = await db.comment.update({
      where: { id },
      data: {
        content: content.trim(),
      },
      include: {
        Kit: {
          select: {
            id: true,
            name: true,
            team: true,
            type: true,
          }
        },
        Replies: true,
      }
    });

    return NextResponse.json(updatedComment);
  } catch (error) {
    console.error('Error updating comment:', error);
    return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 });
  }
}

// DELETE - Cancella un commento (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const adminToken = searchParams.get('adminToken');

    console.log('DELETE comment request:', { id, adminToken: adminToken ? adminToken.substring(0, 20) + '...' : 'null' });

    if (!id) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 });
    }

    // Verifica admin token usando la stessa logica del login
    if (!adminToken || !verifyAuthToken(adminToken)) {
      console.log('Token verification failed for token:', adminToken ? adminToken.substring(0, 20) + '...' : 'null');
      return NextResponse.json({ error: 'Unauthorized - Admin only' }, { status: 403 });
    }

    // Verifica che il commento esista
    const existingComment = await db.comment.findUnique({
      where: { id }
    });

    if (!existingComment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Cancella il commento (le risposte vengono cancellate in cascade)
    await db.comment.delete({
      where: { id }
    });

    return NextResponse.json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}
