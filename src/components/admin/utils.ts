import { Kit, Player } from './types';

// Kit type translation
export const translateKitType = (type: string): string => {
  const translations: Record<string, string> = {
    home: 'Casa',
    away: 'Trasfetta',
    third: 'Terza',
    goalkeeper: 'Portiere',
  };
  return translations[type] || type;
};

// Reverse translation - Italian to English
export const reverseTranslateKitType = (italianType: string): string => {
  const reverseTranslations: Record<string, string> = {
    casa: 'home',
    trasfetta: 'away',
    terza: 'third',
    portiere: 'goalkeeper',
  };
  return reverseTranslations[italianType.toLowerCase()] || italianType;
};

// Check if kit type matches search (works with both Italian and English)
export const kitTypeMatches = (kitType: string, searchTerm: string): boolean => {
  const typeLower = kitType.toLowerCase();
  const searchLower = searchTerm.toLowerCase();

  // Direct match in English
  if (typeLower.includes(searchLower)) return true;

  // Match in Italian translation
  const italianType = translateKitType(kitType).toLowerCase();
  if (italianType.includes(searchLower)) return true;

  return false;
};

// Get kit type color for badge
export const getKitTypeColor = (type: string) => {
  const colors: Record<string, string> = {
    home: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    away: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    third: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    goalkeeper: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  };
  return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
};

// Get player display name
export const getPlayerDisplayName = (player: Player): string => {
  return player.surname ? `${player.name} ${player.surname}` : player.name;
};
