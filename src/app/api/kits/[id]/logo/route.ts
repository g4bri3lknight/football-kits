import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const kit = await db.kit.findUnique({
      where: { id },
      select: {
        logoData: true,
        logoMimeType: true,
      },
    });

    if (!kit || !kit.logoData) {
      return NextResponse.json({ error: 'Logo not found' }, { status: 404 });
    }

    const buffer = Buffer.from(kit.logoData);
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': kit.logoMimeType || 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching kit logo:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit logo' },
      { status: 500 }
    );
  }
}
