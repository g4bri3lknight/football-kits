import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const backgroundDir = path.join(process.cwd(), 'public', 'background');
    
    // Crea la cartella se non esiste
    if (!fs.existsSync(backgroundDir)) {
      fs.mkdirSync(backgroundDir, { recursive: true });
      return NextResponse.json({ images: [] });
    }
    
    // Leggi i file nella cartella
    const files = fs.readdirSync(backgroundDir);
    
    // Filtra solo le immagini
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files.filter(file => 
      imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
    );
    
    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error reading background directory:', error);
    return NextResponse.json({ images: [] });
  }
}
