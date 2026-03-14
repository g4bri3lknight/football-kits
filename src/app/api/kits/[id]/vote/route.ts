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

    const kit = await db.kit.findUnique({
      where: { id },
    });

    if (!kit) {
      return NextResponse.json({ error: 'Kit not found' }, { status: 404 });
    }

    // Controlla se l'utente ha già votato questo kit
    const existingVote = await db.kitVote.findUnique({
      where: {
        kitId_userId: {
          kitId: id,
          userId: userId,
        },
      },
    });

    let updatedKit;

    if (existingVote) {
      if (existingVote.voteType === voteType) {
        // L'utente sta cliccando lo stesso tasto -> rimuovi il voto
        await db.kitVote.delete({
          where: { id: existingVote.id },
        });

        updatedKit = await db.kit.update({
          where: { id },
          data: {
            likes: voteType === 'like' ? Math.max(0, kit.likes - 1) : kit.likes,
            dislikes: voteType === 'dislike' ? Math.max(0, kit.dislikes - 1) : kit.dislikes,
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          action: 'removed',
          likes: updatedKit.likes,
          dislikes: updatedKit.dislikes,
          userVote: null,
        });
      } else {
        // L'utente sta cambiando il voto
        await db.kitVote.update({
          where: { id: existingVote.id },
          data: { voteType },
        });

        updatedKit = await db.kit.update({
          where: { id },
          data: {
            likes: voteType === 'like' ? kit.likes + 1 : Math.max(0, kit.likes - 1),
            dislikes: voteType === 'dislike' ? kit.dislikes + 1 : Math.max(0, kit.dislikes - 1),
            updatedAt: new Date(),
          },
        });

        return NextResponse.json({
          success: true,
          action: 'changed',
          likes: updatedKit.likes,
          dislikes: updatedKit.dislikes,
          userVote: voteType,
        });
      }
    } else {
      // Nuovo voto
      await db.kitVote.create({
        data: {
          kitId: id,
          userId: userId,
          voteType: voteType,
        },
      });

      updatedKit = await db.kit.update({
        where: { id },
        data: {
          likes: voteType === 'like' ? kit.likes + 1 : kit.likes,
          dislikes: voteType === 'dislike' ? kit.dislikes + 1 : kit.dislikes,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        action: 'added',
        likes: updatedKit.likes,
        dislikes: updatedKit.dislikes,
        userVote: voteType,
      });
    }
  } catch (error) {
    console.error('Error voting for kit:', error);
    return NextResponse.json(
      { error: 'Failed to vote for kit', details: error instanceof Error ? error.message : String(error) },
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

    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        likes: true,
        dislikes: true,
      },
    });

    if (!kit) {
      return NextResponse.json({ error: 'Kit not found' }, { status: 404 });
    }

    let userVote = null;
    if (userId) {
      const existingVote = await db.kitVote.findUnique({
        where: {
          kitId_userId: {
            kitId: id,
            userId: userId,
          },
        },
        select: { voteType: true },
      });
      userVote = existingVote?.voteType || null;
    }

    return NextResponse.json({
      likes: kit.likes,
      dislikes: kit.dislikes,
      userVote,
    });
  } catch (error) {
    console.error('Error getting kit votes:', error);
    return NextResponse.json(
      { error: 'Failed to get kit votes' },
      { status: 500 }
    );
  }
}
