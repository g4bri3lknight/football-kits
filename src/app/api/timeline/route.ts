import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Funzione per estrarre e normalizzare la stagione dal nome del kit
function extractSeason(name: string | null | undefined): string | null {
  // Pattern supportati:
  // - "2020/2021" -> "2020/2021"
  // - "2020-21" -> "2020/2021"
  // - "2020 - 21" -> "2020/2021"
  // - "2020 / 21" -> "2020/2021"
  
  if (!name || typeof name !== 'string') return null;
  
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
    // Recupera tutti i playerKit usando select esplicito per evitare
    // l'errore "Failed to convert rust String into napi string" sui campi Bytes
    const playerKits = await db.playerKit.findMany({
      select: {
        id: true,
        playerId: true,
        kitId: true,
        createdAt: true,
        updatedAt: true,
        Kit: {
          select: {
            id: true,
            name: true,
            team: true,
            type: true,
            createdAt: true,
            updatedAt: true,
            status: true,
            hasImage: true,
            hasLogo: true,
            hasModel3D: true,
            hasDetail1: true,
            hasDetail2: true,
            hasDetail3: true,
            hasDetail4: true,
            hasDetail5: true,
            hasDetail6: true,
            detail1Label: true,
            detail2Label: true,
            detail3Label: true,
            detail4Label: true,
            detail5Label: true,
            detail6Label: true,
            likes: true,
            dislikes: true,
          },
        },
        Player: {
          select: {
            id: true,
            name: true,
            surname: true,
            nationId: true,
            biography: true,
            createdAt: true,
            updatedAt: true,
            hasImage: true,
            status: true,
            Nation: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
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
      hasModel3D: boolean;
      hasDetail1: boolean;
      hasDetail2: boolean;
      hasDetail3: boolean;
      hasDetail4: boolean;
      hasDetail5: boolean;
      hasDetail6: boolean;
      detail1Label: string | null;
      detail2Label: string | null;
      detail3Label: string | null;
      detail4Label: string | null;
      detail5Label: string | null;
      detail6Label: string | null;
      status: string;
      likes: number;
      dislikes: number;
      updatedAt: Date;
      player: {
        id: string;
        name: string;
        surname: string | null;
        hasImage: boolean;
        status: string;
        biography: string | null;
        nationId: string | null;
        Nation: {
          id: string;
          name: string;
          code: string;
          flag: string | null;
        } | null;
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
          hasModel3D: pk.Kit.hasModel3D,
          hasDetail1: pk.Kit.hasDetail1,
          hasDetail2: pk.Kit.hasDetail2,
          hasDetail3: pk.Kit.hasDetail3,
          hasDetail4: pk.Kit.hasDetail4,
          hasDetail5: pk.Kit.hasDetail5,
          hasDetail6: pk.Kit.hasDetail6,
          detail1Label: pk.Kit.detail1Label,
          detail2Label: pk.Kit.detail2Label,
          detail3Label: pk.Kit.detail3Label,
          detail4Label: pk.Kit.detail4Label,
          detail5Label: pk.Kit.detail5Label,
          detail6Label: pk.Kit.detail6Label,
          status: pk.Kit.status,
          likes: pk.Kit.likes,
          dislikes: pk.Kit.dislikes,
          updatedAt: pk.Kit.updatedAt,
          player: {
            id: pk.Player.id,
            name: pk.Player.name,
            surname: pk.Player.surname,
            hasImage: pk.Player.hasImage,
            status: pk.Player.status,
            biography: pk.Player.biography,
            nationId: pk.Player.nationId,
            Nation: pk.Player.Nation,
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
