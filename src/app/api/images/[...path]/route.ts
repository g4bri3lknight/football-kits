import { NextRequest, NextResponse } from 'next/server';
import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

// GET /api/images/[...path] - Serve immagini dalla cartella public
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const imagePath = join(process.cwd(), 'public', ...path);

    // Verifica se il file esiste
    if (!existsSync(imagePath)) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Leggi il file
    const imageBuffer = await readFile(imagePath);

    // Determina il content type basato sull'estensione
    const ext = path[path.length - 1].split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'svg': 'image/svg+xml',
      'glb': 'model/gltf-binary',
      'gltf': 'model/gltf+json',
    };

    const contentType = contentTypes[ext || ''] || 'application/octet-stream';

    // Restituisci il file con il corretto content type
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Error serving file' },
      { status: 500 }
    );
  }
}
