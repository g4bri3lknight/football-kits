'use client';

import { Player, ContentStatus, CONTENT_STATUS_LABELS } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import Flag from 'react-world-flags';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';
import { 
  getPlayerDisplayName, 
  getKitTypeColor, 
  translateKitType, 
  sortKitsBySeason, 
  filterPlayerKits 
} from '@/lib/player-utils';

interface PlayerCardProps {
  player: Player;
  kitSeasonFilter: string;
  kitTeamFilter: string;
  onPlayerClick: (player: Player) => void;
  onKitClick: (kit: Player['PlayerKit'][0]['Kit'], player: Player) => void;
  index?: number;
}

// Helper per ottenere l'URL dell'immagine del giocatore
const getPlayerImageUrl = (playerId: string, updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/players/${playerId}/image${cacheBuster}`;
};

// Helper per ottenere l'URL del kit
const getKitImageUrl = (kitId: string, type: 'image' | 'logo', updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/kits/${kitId}/${type}${cacheBuster}`;
};

// Status badge colors
const getStatusBadgeStyle = (status: ContentStatus) => {
  switch (status) {
    case 'NUOVO':
      return 'bg-green-500 text-white hover:bg-green-600';
    case 'AGGIORNATO':
      return 'bg-amber-500 text-white hover:bg-amber-600';
    default:
      return '';
  }
};

export function PlayerCard({ 
  player, 
  kitSeasonFilter, 
  kitTeamFilter, 
  onPlayerClick, 
  onKitClick,
  index = 0
}: PlayerCardProps) {
  const filteredKits = filterPlayerKits(player, kitSeasonFilter, kitTeamFilter);
  const sortedKits = sortKitsBySeason(filteredKits);
  
  // Check if player has a visible status
  const hasVisibleStatus = player.status && player.status !== 'NON_IMPOSTATO';

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.08
      }}
      whileHover={{ 
        scale: 1.03, 
        y: -5,
        transition: { type: 'spring', stiffness: 400, damping: 20 }
      }}
      whileTap={{ scale: 0.98 }}
      className="h-full"
    >
      <Card
        className="overflow-hidden hover:shadow-xl active:shadow-xl transition-all duration-300 cursor-pointer border-2 transition-custom-color hover:transition-custom-color active:transition-custom-color backdrop-blur-sm card-custom-color relative card-glow h-full"
        onClick={() => onPlayerClick(player)}
      >
      {/* Status Badge - Top Right */}
      {hasVisibleStatus && (
        <Badge 
          className={`absolute top-2 right-2 z-10 text-xs font-semibold px-2 py-1 ${getStatusBadgeStyle(player.status!)}`}
        >
          {CONTENT_STATUS_LABELS[player.status!]}
        </Badge>
      )}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-1 avatar-custom-color">
              <AvatarImage 
                src={player.hasImage ? getPlayerImageUrl(player.id, player.updatedAt) : undefined} 
                alt={player.name} 
              />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {(player.name[0] + (player.surname?.[0] || '')).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base sm:text-lg truncate">{getPlayerDisplayName(player)}</CardTitle>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                {player.Nation && (
                  <Badge variant="secondary" className="text-xs items-center gap-1.5">
                    <Flag code={convertAlpha3ToAlpha2(player.Nation.code)} className="w-4 h-3 object-cover" />
                    {player.Nation.name}
                  </Badge>
                )}
                {player.biography && (
                  <Badge variant="outline" className="text-xs">
                    <BookOpen className="w-3 h-3 mr-1" />
                    Biografia disponibile
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-3">
        <ScrollArea className="h-32 sm:h-40 pr-2">
          <div className="space-y-2">
            {sortedKits.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nessun kit associato
              </p>
            ) : (
              sortedKits.map((playerKit) => (
                <div
                  key={playerKit.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onKitClick(playerKit.Kit, player);
                  }}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted cursor-pointer transition-colors group"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {playerKit.Kit.hasLogo ? (
                      <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                        <img
                          src={getKitImageUrl(playerKit.Kit.id, 'logo', playerKit.Kit.updatedAt)}
                          alt={`Logo ${playerKit.Kit.team}`}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    ) : playerKit.Kit.hasImage ? (
                      <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                        <img
                          src={getKitImageUrl(playerKit.Kit.id, 'image', playerKit.Kit.updatedAt)}
                          alt={playerKit.Kit.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : null}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {playerKit.Kit.name} - {playerKit.Kit.team}
                      </p>
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Badge className={getKitTypeColor(playerKit.Kit.type)} variant="secondary">
                          {translateKitType(playerKit.Kit.type)}
                        </Badge>
                        {/* Kit Status Badge */}
                        {playerKit.Kit.status && playerKit.Kit.status !== 'NON_IMPOSTATO' && (
                          <Badge 
                            className={`text-xs font-semibold ${getStatusBadgeStyle(playerKit.Kit.status)}`}
                          >
                            {CONTENT_STATUS_LABELS[playerKit.Kit.status]}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
    </motion.div>
  );
}
