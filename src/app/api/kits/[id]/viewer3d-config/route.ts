import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyAuthToken } from '@/lib/auth';

// GET /api/kits/[id]/viewer3d-config - Get per-kit 3D viewer configuration
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const config = await db.kitViewer3DConfig.findUnique({
      where: { kitId: id },
    });

    if (!config) {
      return NextResponse.json({ found: false });
    }

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error fetching kit viewer3d config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch kit viewer3d config' },
      { status: 500 }
    );
  }
}

// PUT /api/kits/[id]/viewer3d-config - Create or update per-kit 3D viewer configuration
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { adminToken, kitId, id: configId, ...configData } = body;

    // Verify admin token
    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    // Upsert the config for this kit
    const config = await db.kitViewer3DConfig.upsert({
      where: { kitId: id },
      update: configData,
      create: {
        kitId: id,
        ...configData,
      },
    });

    return NextResponse.json(config);
  } catch (error) {
    console.error('Error updating kit viewer3d config:', error);
    return NextResponse.json(
      { error: 'Failed to update kit viewer3d config' },
      { status: 500 }
    );
  }
}

// DELETE /api/kits/[id]/viewer3d-config - Delete per-kit 3D viewer configuration
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin token from request body
    const body = await request.json().catch(() => ({}));
    const adminToken = body.adminToken;
    if (!adminToken || !verifyAuthToken(adminToken)) {
      return NextResponse.json(
        { error: 'Sessione scaduta', details: 'La tua sessione è scaduta. Effettua nuovamente il login.' },
        { status: 401 }
      );
    }

    await db.kitViewer3DConfig.delete({
      where: { kitId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting kit viewer3d config:', error);
    return NextResponse.json(
      { error: 'Failed to delete kit viewer3d config' },
      { status: 500 }
    );
  }
}
