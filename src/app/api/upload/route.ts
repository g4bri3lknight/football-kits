import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// POST /api/upload - Carica un file e restituisce i dati in base64
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Nessun file fornito' },
        { status: 400 }
      );
    }

    // Leggi il file come ArrayBuffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Converti in base64
    const base64 = buffer.toString('base64');
    const mimeType = file.type || 'application/octet-stream';

    // Restituisci i dati del file
    return NextResponse.json({
      success: true,
      data: base64,
      mimeType,
      fileName: file.name,
      size: file.size,
    }, { status: 201 });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Errore durante il caricamento del file' },
      { status: 500 }
    );
  }
}
