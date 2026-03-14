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
        model3DData: true,
        model3DName: true,
      },
    });

    if (!kit || !kit.model3DData) {
      return NextResponse.json({ error: 'Model 3D not found' }, { status: 404 });
    }

    const buffer = Buffer.from(kit.model3DData);
    const fileName = kit.model3DName || 'model.glb';
    
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'model/gltf-binary',
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error fetching kit model 3D:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit model 3D' },
      { status: 500 }
    );
  }
}
