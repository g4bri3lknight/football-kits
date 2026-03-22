import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { voteType, userId } = body; // 'like' o 'dislike'

    if (!voteType || !['like', 'dislike'].includes(voteType)) {
      return NextResponse.json(
        { error: 'Invalid vote type. Use "like" or "dislike"' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const comment = await db.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // Controlla se l'utente ha già votato questo commento
    const existingVote = await db.commentVote.findUnique({
      where: {
        commentId_userId: {
          commentId: id,
          userId: userId,
        },
      },
    });

    let updatedComment;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // L'utente sta cliccando lo stesso tasto -> rimuovi il voto
        await db.commentVote.delete({
          where: { id: existingVote.id },
        });

        updatedComment = await db.comment.update({
          where: { id },
          data: {
            likes: voteType === 'like' ? Math.max(0, comment.likes - 1) : comment.likes,
            dislikes: voteType === 'dislike' ? Math.max(0, comment.dislikes - 1) : comment.dislikes,
          },
        });

        return NextResponse.json({
          success: true,
          action: 'removed',
          likes: updatedComment.likes,
          dislikes: updatedComment.dislikes,
          userVote: null,
        });
      } else {
        // L'utente sta cambiando il voto
        await db.commentVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });

        updatedComment = await db.comment.update({
          where: { id },
          data: {
            likes: voteType === 'like' ? comment.likes + 1 : Math.max(0, comment.likes - 1),
            dislikes: voteType === 'dislike' ? comment.dislikes + 1 : Math.max(0, comment.dislikes - 1),
          },
        });

        return NextResponse.json({
          success: true,
          action: 'changed',
          likes: updatedComment.likes,
          dislikes: updatedComment.dislikes,
          userVote: voteType,
        });
      }
    } else {
      // Nuovo voto
      await db.commentVote.create({
        data: {
          commentId: id,
          userId: userId,
          voteType: voteType,
        },
      });

      updatedComment = await db.comment.update({
        where: { id },
        data: {
          likes: voteType === 'like' ? comment.likes + 1 : comment.likes,
          dislikes: voteType === 'dislike' ? comment.dislikes + 1 : comment.dislikes,
        },
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        likes: updatedComment.likes,
        dislikes: updatedComment.dislikes,
        userVote: voteType,
      });
    }
  } catch (error) {
    console.error('Error voting for comment:', error);
    return NextResponse.json(
      { error: 'Failed to vote for comment', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.nextUrl.searchParams.get('userId');

    const comment = await db.comment.findUnique({
      where: { id },
      select: {
        likes: true,
        dislikes: true,
      },
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    let userVote = null;
    if (userId) {
      const existingVote = await db.commentVote.findUnique({
        where: {
          commentId_userId: {
            commentId: id,
            userId: userId,
          },
        },
        select: { voteType: true },
      });
      userVote = existingVote?.voteType || null;
    }

    return NextResponse.json({
      likes: comment.likes,
      dislikes: comment.dislikes,
      userVote,
    });
  } catch (error) {
    console.error('Error getting comment votes:', error);
    return NextResponse.json(
      { error: 'Failed to get comment votes' },
      { status: 500 }
    );
  }
}
