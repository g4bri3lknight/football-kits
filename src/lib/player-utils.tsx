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
    const seasonA = a.Kit.name.match(/\d{4}/);
    const seasonB = b.Kit.name.match(/\d{4}/);
    if (seasonA && seasonB) {
      return parseInt(seasonA[0]) - parseInt(seasonB[0]);
    }
    return 0;
  });
};

export const filterPlayerKits = (player: Player, kitSeasonFilter: string, kitTeamFilter: string) => {
  return player.PlayerKit.filter(pk => {
    const matchesSeason = !kitSeasonFilter ||
      pk.Kit.name.toLowerCase().includes(kitSeasonFilter.toLowerCase());
    const matchesTeam = !kitTeamFilter ||
      pk.Kit.team.toLowerCase().includes(kitTeamFilter.toLowerCase());
    return matchesSeason && matchesTeam;
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
