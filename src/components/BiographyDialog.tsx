'use client';

import { Player } from '@/types';
import { getImageUrl } from '@/lib/image-url';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { BookOpen, ExternalLink } from 'lucide-react';
import Flag from 'react-world-flags';
import { convertAlpha3ToAlpha2 } from '@/lib/country-codes';
import { getPlayerDisplayName, isUrl, renderTextWithLinks } from '@/lib/player-utils';

interface BiographyDialogProps {
  selectedPlayer: Player | null;
  onClose: () => void;
}

export function BiographyDialog({ selectedPlayer, onClose }: BiographyDialogProps) {
  return (
    <Dialog open={!!selectedPlayer} onOpenChange={() => onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col dialog-custom-color">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl sm:text-2xl flex items-center gap-3">
            <BookOpen className="w-8 h-8" />
            Biografia
          </DialogTitle>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-6 flex-1 overflow-hidden">
          {/* Colonna sinistra: Immagine */}
          <div className="flex-shrink-0 flex sm:block justify-center">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-muted border-2 border-primary/20 shadow-xl biography-img-custom-border">
              {selectedPlayer?.image ? (
                <img
                  src={getImageUrl(selectedPlayer.image)}
                  alt={getPlayerDisplayName(selectedPlayer)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {selectedPlayer && (selectedPlayer.name[0] + (selectedPlayer.surname?.[0] || '')).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>

          {/* Colonna destra: Contenuto */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Nome e nazionalità */}
            <div className="text-center sm:text-left space-y-2 mb-4 flex-shrink-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {selectedPlayer && getPlayerDisplayName(selectedPlayer)}
              </h2>
              {selectedPlayer?.Nation && (
                <Badge variant="secondary" className="text-sm items-center gap-2">
                  <Flag code={convertAlpha3ToAlpha2(selectedPlayer.Nation.code)} className="w-5 h-4 object-cover" />
                  {selectedPlayer.Nation.name}
                </Badge>
              )}
            </div>

            <Separator className="flex-shrink-0" />

            {/* Biografia con ScrollArea */}
            <div className="flex-1 overflow-hidden mt-4 min-h-0">
              <ScrollArea className="h-full">
                {selectedPlayer?.biography ? (
                  isUrl(selectedPlayer.biography) ? (
                    <div className="py-6">
                      <Button
                        onClick={() => window.open(selectedPlayer.biography!, '_blank', 'noopener,noreferrer')}
                        size="lg"
                        className="gap-2"
                      >
                        <ExternalLink className="w-5 h-5" />
                        Vai alla biografia su Wikipedia
                      </Button>
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none bg-muted/50 rounded-lg p-4 sm:p-6">
                      <div className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
                        {renderTextWithLinks(selectedPlayer.biography)}
                      </div>
                    </div>
                  )
                ) : (
                  <div className="py-8 text-muted-foreground flex flex-col items-center justify-center min-h-[200px]">
                    <BookOpen className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-center">Nessuna biografia disponibile</p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </div>
        </div>
        <div className="flex justify-end pt-4 border-t flex-shrink-0">
          <Button onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
