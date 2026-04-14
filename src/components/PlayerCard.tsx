'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Player, ContentStatus, CONTENT_STATUS_LABELS } from '@/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

interface HoveredKit {
  kit: Player['PlayerKit'][0]['Kit'];
  rect: DOMRect;
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

// Componente miniatura kit
function KitThumbnail({ kit, player, onClick, onHover, onLeave }: {
  kit: Player['PlayerKit'][0]['Kit'];
  player: Player;
  onClick: () => void;
  onHover: (info: HoveredKit) => void;
  onLeave: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseEnter = useCallback(() => {
    if (ref.current) {
      onHover({ kit, rect: ref.current.getBoundingClientRect() });
    }
  }, [kit, onHover]);

  return (
    <div
      ref={ref}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onLeave}
      className="relative h-16 sm:h-[72px] rounded-lg overflow-hidden cursor-pointer border border-border/50 hover:border-primary/60 transition-all hover:scale-105 hover:shadow-md"
    >
      {kit.hasImage ? (
        <img
          src={getKitImageUrl(kit.id, 'image', kit.updatedAt)}
          alt={kit.name}
          className="w-full h-full object-cover"
        />
      ) : kit.hasLogo ? (
        <div className="w-full h-full flex items-center justify-center bg-muted/50">
          <img
            src={getKitImageUrl(kit.id, 'logo', kit.updatedAt)}
            alt={`Logo ${kit.team}`}
            className="w-3/4 h-3/4 object-contain p-1"
          />
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted/50 text-muted-foreground text-xs">?</div>
      )}
      {kit.status && kit.status !== 'NON_IMPOSTATO' && (
        <div className={`absolute top-0.5 right-0.5 w-2 h-2 rounded-full ${kit.status === 'NUOVO' ? 'bg-green-400' : 'bg-amber-400'}`} />
      )}
    </div>
  );
}

// Tooltip renderizzato tramite portal sul body (sfugge a transform/overflow)
function KitTooltip({ hoveredKit }: { hoveredKit: HoveredKit }) {
  const { kit, rect } = hoveredKit;
  const top = rect.bottom + 6;
  const left = rect.left + rect.width / 2;

  return createPortal(
    <div
      className="fixed z-[9999] pointer-events-none"
      style={{ top, left, transform: 'translateX(-50%)' }}
    >
      <div className="bg-popover text-popover-foreground border rounded-md shadow-lg px-2.5 py-1.5 text-xs whitespace-nowrap text-center">
        <p className="font-medium">{kit.name} - {kit.team}</p>
        <div className="flex items-center justify-center gap-1 mt-1">
          <span className={`text-[10px] px-1 py-0 rounded ${getKitTypeColor(kit.type)}`}>
            {translateKitType(kit.type)}
          </span>
          {kit.status && kit.status !== 'NON_IMPOSTATO' && (
            <span className={`text-[10px] px-1 py-0 rounded ${getStatusBadgeStyle(kit.status)}`}>
              {CONTENT_STATUS_LABELS[kit.status]}
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

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

  // Tooltip state - gestito qui per renderizzare fuori dalla scroll area
  const [hoveredKit, setHoveredKit] = useState<HoveredKit | null>(null);
  const [mounted, setMounted] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { setMounted(true); }, []);

  const handleKitHover = useCallback((info: HoveredKit) => {
    clearTimeout(hideTimer.current);
    setHoveredKit(info);
  }, []);

  const handleKitLeave = useCallback(() => {
    hideTimer.current = setTimeout(() => setHoveredKit(null), 100);
  }, []);

  return (
    <>
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
      <CardContent className="pt-3 pb-3">
        {sortedKits.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nessun kit associato
          </p>
        ) : (
          <div className="kit-grid-scroll overflow-y-auto overflow-x-hidden max-h-[142px] sm:max-h-[158px] p-1">
            <div className="grid grid-cols-4 gap-1.5">
              {sortedKits.map((playerKit) => (
                <KitThumbnail
                  key={playerKit.id}
                  kit={playerKit.Kit}
                  player={player}
                  onClick={() => onKitClick(playerKit.Kit, player)}
                  onHover={handleKitHover}
                  onLeave={handleKitLeave}
                />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
    </motion.div>
    {/* Tooltip renderizzato via portal sul body, fuori da motion.div e scroll area */}
    {mounted && hoveredKit && <KitTooltip hoveredKit={hoveredKit} />}
    </>
  );
}
