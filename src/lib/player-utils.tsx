import { Player, PlayerKit } from '@/types';

export const getKitTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    home: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    away: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    third: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    gk: 'gk-badge',
  };
  return colors[type] || 'gk-badge';
};

export const translateKitType = (type: string): string => {
  const translations: Record<string, string> = {
    home: 'Home',
    away: 'Away',
    third: 'Third',
    gk: 'GK',
    goalkeeper: 'GK',
    Goalkeeper: 'GK',
  };
  return translations[type] || type;
};

export const getPlayerDisplayName = (player: Player): string => {
  return player.surname ? `${player.name} ${player.surname}` : player.name;
};

export const isUrl = (text: string) => {
  try {
    new URL(text);
    return true;
  } catch {
    return false;
  }
};

export const sortKitsBySeason = (kits: PlayerKit[]) => {
  return kits.sort((a, b) => {
    if (!a.Kit?.name || !b.Kit?.name) return 0;
    const seasonA = a.Kit.name.match(/\d{4}/);
    const seasonB = b.Kit.name.match(/\d{4}/);
    if (seasonA && seasonB) {
      return parseInt(seasonA[0]) - parseInt(seasonB[0]);
    }
    return 0;
  });
};

// leagueNationFilter / leagueNameFilter: nazione e nome del campionato ('' = nessun filtro); i kit senza campionato non passano
export const filterPlayerKits = (
  player: Player,
  kitSeasonFilter: string,
  kitTeamFilter: string,
  leagueNationFilter: string = '',
  leagueNameFilter: string = ''
) => {
  return player.PlayerKit.filter(pk => {
    if (!pk.Kit?.name || !pk.Kit?.team) return false;
    const matchesSeason = !kitSeasonFilter ||
      pk.Kit.name.toLowerCase().includes(kitSeasonFilter.toLowerCase());
    const matchesTeam = !kitTeamFilter ||
      pk.Kit.team.toLowerCase().includes(kitTeamFilter.toLowerCase());
    const matchesLeagueNation = !leagueNationFilter || pk.Kit.League?.nation === leagueNationFilter;
    const matchesLeagueName = !leagueNameFilter || pk.Kit.League?.name === leagueNameFilter;
    return matchesSeason && matchesTeam && matchesLeagueNation && matchesLeagueName;
  });
};

export const renderTextWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      const url = part.startsWith('www.') ? `https://${part}` : part;
      return (
        <a
          key={index}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80 break-all"
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

// ---- Carriera: squadre in cui ha giocato il portiere (ricavate dalle maglie in archivio) ----
export interface CareerStint {
  team: string;
  firstYear: number | null;
  lastYear: number | null;
  seasons: string[]; // es. "2005/06"
  kitCount: number;
  logoKitId: string | null; // kit da cui prendere il logo della squadra (il più recente con logo)
  logoUpdatedAt?: string | Date;
}

const seasonStart = (name: string | null | undefined): number | null => {
  const m = name?.match(/^(\d{4})\s*[/\-]\s*(\d{2,4})/);
  return m ? parseInt(m[1], 10) : null;
};

export const seasonShort = (year: number) => `${year}/${String((year + 1) % 100).padStart(2, '0')}`;

/** Raggruppa le maglie per squadra e ordina le squadre dalla più vecchia alla più recente. */
export const getPlayerCareer = (player: Player): CareerStint[] => {
  const byTeam = new Map<string, { years: Set<number>; kits: { id: string; year: number | null; hasLogo: boolean; updatedAt?: string | Date }[] }>();
  for (const pk of player.PlayerKit || []) {
    const k = pk.Kit;
    if (!k?.team) continue;
    const e = byTeam.get(k.team) ?? { years: new Set<number>(), kits: [] };
    const y = seasonStart(k.name);
    if (y !== null) e.years.add(y);
    e.kits.push({ id: k.id, year: y, hasLogo: !!k.hasLogo, updatedAt: (k as { updatedAt?: string | Date }).updatedAt });
    byTeam.set(k.team, e);
  }
  const out: CareerStint[] = [];
  byTeam.forEach((e, team) => {
    const ys = [...e.years].sort((a, b) => a - b);
    const withLogo = [...e.kits].sort((a, b) => (b.year ?? -1) - (a.year ?? -1)).find((k) => k.hasLogo);
    out.push({
      team,
      firstYear: ys.length ? ys[0] : null,
      lastYear: ys.length ? ys[ys.length - 1] : null,
      seasons: ys.map(seasonShort),
      kitCount: e.kits.length,
      logoKitId: withLogo ? withLogo.id : null,
      logoUpdatedAt: withLogo?.updatedAt,
    });
  });
  return out.sort((a, b) => (a.firstYear ?? 9999) - (b.firstYear ?? 9999) || a.team.localeCompare(b.team));
};
