import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione per estrarre e normalizzare la stagione dal nome del kit
function extractSeason(name: string): string | null {
  // Pattern supportati:
  // - "2020/2021" -> "2020/2021"
  // - "2020-21" -> "2020/2021"
  // - "2020 - 21" -> "2020/2021"
  // - "2020 / 21" -> "2020/2021"
  
  const match = name.match(/^(\d{4})\s*[/\-]\s*(\d{2,4})/);
  if (match) {
    const startYear = match[1];
    let endYear = match[2];
    
    // Se l'anno finale ha solo 2 cifre, completalo
    if (endYear.length === 2) {
      endYear = startYear.substring(0, 2) + endYear;
    }
    
    // Normalizza nel formato "yyyy/yyyy"
    return `${startYear}/${endYear}`;
  }
  return null;
}

// GET /api/timeline - Ottiene tutti i kit organizzati per anno
export async function GET() {
  try {
    // Recupera tutti i playerKit
    const playerKits = await db.playerKit.findMany({
      include: {
        Kit: true,
        Player: true,
      },
    });

    // Raggruppa per anno
    const yearGroups: Record<string, Array<{
      id: string;
      name: string;
      team: string;
      type: string;
      hasImage: boolean;
      hasLogo: boolean;
      updatedAt: Date;
      player: {
        id: string;
        name: string;
        surname: string | null;
      };
      playerKitId: string;
    }>> = {};
    
    for (const pk of playerKits) {
      if (!pk.Kit) continue;
      
      const season = extractSeason(pk.Kit.name);
      if (season) {
        if (!yearGroups[season]) {
          yearGroups[season] = [];
        }
        yearGroups[season].push({
          id: pk.Kit.id,
          name: pk.Kit.name,
          team: pk.Kit.team,
          type: pk.Kit.type,
          hasImage: pk.Kit.hasImage,
          hasLogo: pk.Kit.hasLogo,
          updatedAt: pk.Kit.updatedAt,
          player: {
            id: pk.Player.id,
            name: pk.Player.name,
            surname: pk.Player.surname,
          },
          playerKitId: pk.id,
        });
      }
    }

    // Converti in array ordinato
    const timeline = Object.entries(yearGroups)
      .map(([year, kits]) => ({
        year,
        kits: kits.sort((a, b) => {
          const playerA = `${a.player.name} ${a.player.surname || ''}`.toLowerCase();
          const playerB = `${b.player.name} ${b.player.surname || ''}`.toLowerCase();
          return playerA.localeCompare(playerB);
        }),
      }))
      .sort((a, b) => {
        const yearA = parseInt(a.year.split('/')[0]);
        const yearB = parseInt(b.year.split('/')[0]);
        return yearB - yearA;
      });

    return NextResponse.json(timeline);
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return NextResponse.json(
      { error: 'Failed to fetch timeline' },
      { status: 500 }
    );
  }
}
