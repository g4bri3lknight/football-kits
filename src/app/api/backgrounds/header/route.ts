import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const headerBackgroundDir = path.join(process.cwd(), 'public', 'background', 'header');
    
    // Crea la cartella se non esiste
    if (!fs.existsSync(headerBackgroundDir)) {
      fs.mkdirSync(headerBackgroundDir, { recursive: true });
      return NextResponse.json({ images: [], hasImages: false });
    }
    
    // Leggi i file nella cartella
    const files = fs.readdirSync(headerBackgroundDir);
    
    // Filtra solo le immagini
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const images = files.filter(file => 
      imageExtensions.some(ext => file.toLowerCase().endsWith(ext))
    );
    
    console.log(`Header backgrounds found: ${images.length} images in ${headerBackgroundDir}`);
    
    return NextResponse.json({ 
      images, 
      hasImages: images.length > 0 
    });
  } catch (error) {
    console.error('Error reading header background directory:', error);
    return NextResponse.json({ images: [], hasImages: false });
  }
}
