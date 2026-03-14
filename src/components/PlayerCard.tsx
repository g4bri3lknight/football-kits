'use client';

import { Player } from '@/types';
import { getImageUrl } from '@/lib/image-url';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen } from 'lucide-react';
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
}

export function PlayerCard({ 
  player, 
  kitSeasonFilter, 
  kitTeamFilter, 
  onPlayerClick, 
  onKitClick 
}: PlayerCardProps) {
  const filteredKits = filterPlayerKits(player, kitSeasonFilter, kitTeamFilter);
  const sortedKits = sortKitsBySeason(filteredKits);

  return (
    <Card
      className="overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer border-2 transition-custom-color hover:transition-custom-color backdrop-blur-sm card-custom-color"
      onClick={() => onPlayerClick(player)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 ring-1 avatar-custom-color">
              <AvatarImage src={getImageUrl(player.image)} alt={player.name} />
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
                    {playerKit.Kit.logoUrl ? (
                      <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                        <img
                          src={getImageUrl(playerKit.Kit.logoUrl)}
                          alt={`Logo ${playerKit.Kit.team}`}
                          className="w-full h-full object-contain p-1"
                        />
                      </div>
                    ) : playerKit.Kit.imageUrl && (
                      <div className="w-10 h-10 overflow-hidden flex-shrink-0">
                        <img
                          src={getImageUrl(playerKit.Kit.imageUrl)}
                          alt={playerKit.Kit.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {playerKit.Kit.name} - {playerKit.Kit.team}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Badge className={getKitTypeColor(playerKit.Kit.type)} variant="secondary">
                          {translateKitType(playerKit.Kit.type)}
                        </Badge>
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
  );
}
