'use client';

import { Kit, Player, PlayerKit } from '@/types';
import { getImageUrl } from '@/lib/image-url';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shirt } from 'lucide-react';
import KitViewer3D from '@/components/KitViewer3D';
import { getKitTypeColor, translateKitType, getPlayerDisplayName } from '@/lib/player-utils';

interface KitDialogProps {
  selectedKit: Kit | null;
  selectedKitPlayer: Player | null;
  playerKitsList: PlayerKit[];
  currentKitIndex: number;
  onClose: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
}

export function KitDialog({
  selectedKit,
  selectedKitPlayer,
  playerKitsList,
  currentKitIndex,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
}: KitDialogProps) {
  const prevKit = currentKitIndex > 0 && playerKitsList[currentKitIndex - 1] 
    ? playerKitsList[currentKitIndex - 1].Kit 
    : null;
  const nextKit = currentKitIndex < playerKitsList.length - 1 && playerKitsList[currentKitIndex + 1] 
    ? playerKitsList[currentKitIndex + 1].Kit 
    : null;

  const truncateName = (name: string, maxLength: number = 8) => {
    return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
  };

  return (
    <Dialog open={!!selectedKit} onOpenChange={() => onClose()}>
      <DialogContent className={`w-[95vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] overflow-hidden dialog-custom-color ${playerKitsList.length > 1 ? 'lg:h-[90vh] max-h-[95vh]' : 'lg:h-[85vh] max-h-[90vh]'}`}>
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-2">
            {/* Kit precedente */}
            {playerKitsList.length > 1 && prevKit ? (
              <button
                onClick={onNavigatePrevious}
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                title={prevKit.name}
              >
                {prevKit.logoUrl ? (
                  <img
                    src={getImageUrl(prevKit.logoUrl)}
                    alt={prevKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                ) : prevKit.imageUrl ? (
                  <img
                    src={getImageUrl(prevKit.imageUrl)}
                    alt={prevKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-muted rounded flex items-center justify-center">
                    <Shirt className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {truncateName(prevKit.name)}
                </span>
              </button>
            ) : (
              <div className="w-[80px] sm:w-[100px] flex-shrink-0" />
            )}

            {/* Titolo centrato */}
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3 flex-1 justify-center flex-wrap">
              {selectedKit?.logoUrl ? (
                <div className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden flex-shrink-0">
                  <img
                    src={getImageUrl(selectedKit.logoUrl)}
                    alt={`Logo ${selectedKit.team}`}
                    className="w-full h-full object-contain p-1"
                  />
                </div>
              ) : selectedKit?.imageUrl && (
                <div className="w-8 h-8 sm:w-10 sm:h-10 overflow-hidden flex-shrink-0">
                  <img
                    src={getImageUrl(selectedKit.imageUrl)}
                    alt={selectedKit.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <span className="truncate max-w-[120px] sm:max-w-none">{selectedKit?.name}</span>
              {selectedKit && (
                <Badge className={getKitTypeColor(selectedKit.type)} variant="secondary">
                  {translateKitType(selectedKit.type)}
                </Badge>
              )}
            </DialogTitle>

            {/* Kit successivo */}
            {playerKitsList.length > 1 && nextKit ? (
              <button
                onClick={onNavigateNext}
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer mr-8"
                title={nextKit.name}
              >
                {nextKit.logoUrl ? (
                  <img
                    src={getImageUrl(nextKit.logoUrl)}
                    alt={nextKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                ) : nextKit.imageUrl ? (
                  <img
                    src={getImageUrl(nextKit.imageUrl)}
                    alt={nextKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded"
                  />
                ) : (
                  <div className="w-6 h-6 sm:w-7 sm:h-7 bg-muted rounded flex items-center justify-center">
                    <Shirt className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                  </div>
                )}
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {truncateName(nextKit.name)}
                </span>
              </button>
            ) : (
              <div className="w-[80px] sm:w-[100px] flex-shrink-0 mr-8" />
            )}
          </div>

          {/* Indicatore di posizione */}
          {playerKitsList.length > 1 && (
            <div className="text-center text-sm text-muted-foreground mt-1">
              {currentKitIndex + 1} / {playerKitsList.length}
            </div>
          )}
        </DialogHeader>

        <Tabs defaultValue="image" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="image">Image</TabsTrigger>
            <TabsTrigger value="3d">3D Model</TabsTrigger>
          </TabsList>
          <TabsContent value="image" className="mt-0">
            <div className="rounded-lg overflow-hidden bg-muted flex items-center justify-center h-[250px] sm:h-[480px] lg:h-[500px]">
              {selectedKit?.imageUrl ? (
                <img
                  src={getImageUrl(selectedKit.imageUrl)}
                  alt={selectedKit.name}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="text-center p-8">
                  <Shirt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Nessuna immagine presente
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
          <TabsContent value="3d" className="mt-0">
            <div className="rounded-lg bg-muted h-[250px] sm:h-[480px] lg:h-[500px]">
              <KitViewer3D
                modelUrl={selectedKit?.model3DUrl}
                className="h-full"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between items-center pt-3 border-t">
          <div className="text-base font-medium">
            {selectedKitPlayer && (
              <span>Giocatore: <strong className="text-lg">{getPlayerDisplayName(selectedKitPlayer)}</strong></span>
            )}
          </div>
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
