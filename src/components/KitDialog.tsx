'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Kit, Player, PlayerKit } from '@/types';
import { getImageUrl } from '@/lib/image-url';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shirt } from 'lucide-react';
import KitViewer3D from '@/components/KitViewer3D';
import { getPlayerDisplayName } from '@/lib/player-utils';
import { KIT_DETAIL_IMAGE_CONFIG } from '@/config/kit-viewer.config';

interface KitDialogProps {
  selectedKit: Kit | null;
  selectedKitPlayer: Player | null;
  playerKitsList: PlayerKit[];
  currentKitIndex: number;
  onClose: () => void;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
}

interface SelectedDetail {
  url: string;
  label: string | null;
  index: number;
  side: 'left' | 'right';
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
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingDetailRef = useRef<SelectedDetail | null>(null);
  const transitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const ANIMATION_DURATION = 250; // ms to wait for exit animation

  const prevKit = currentKitIndex > 0 && playerKitsList[currentKitIndex - 1] 
    ? playerKitsList[currentKitIndex - 1].Kit 
    : null;
  const nextKit = currentKitIndex < playerKitsList.length - 1 && playerKitsList[currentKitIndex + 1] 
    ? playerKitsList[currentKitIndex + 1].Kit 
    : null;

  const truncateName = (name: string, maxLength: number = 8) => {
    return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
  };

  const handleDetailMouseEnter = useCallback((detail: { url: string; label: string | null }, index: number, side: 'left' | 'right') => {
    if (detail.url) {
      const newDetail: SelectedDetail = { url: detail.url, label: detail.label, index, side };
      
      // If same detail is already selected, do nothing
      if (selectedDetail?.url === detail.url) {
        return;
      }
      
      // If already transitioning, just update pending
      if (isTransitioning) {
        pendingDetailRef.current = newDetail;
        return;
      }
      
      // If there's a current selection, trigger exit first
      if (selectedDetail) {
        // Clear any existing timeout
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
        
        pendingDetailRef.current = newDetail;
        setIsTransitioning(true);
        setSelectedDetail(null);
        
        // Wait for exit animation, then set new detail
        transitionTimeoutRef.current = setTimeout(() => {
          if (pendingDetailRef.current) {
            setSelectedDetail(pendingDetailRef.current);
            pendingDetailRef.current = null;
          }
          setIsTransitioning(false);
        }, ANIMATION_DURATION);
      } else {
        // No current selection, just set directly
        setSelectedDetail(newDetail);
      }
    }
  }, [selectedDetail, isTransitioning]);

  const handleDetailMouseLeave = useCallback(() => {
    // Clear any pending timeout
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current);
      transitionTimeoutRef.current = null;
    }
    pendingDetailRef.current = null;
    setIsTransitioning(false);
    setSelectedDetail(null);
  }, []);

  const leftDetails = [
    { url: selectedKit?.detail1Url, label: selectedKit?.detail1Label },
    { url: selectedKit?.detail2Url, label: selectedKit?.detail2Label },
    { url: selectedKit?.detail3Url, label: selectedKit?.detail3Label },
  ];

  const rightDetails = [
    { url: selectedKit?.detail4Url, label: selectedKit?.detail4Label },
    { url: selectedKit?.detail5Url, label: selectedKit?.detail5Label },
    { url: selectedKit?.detail6Url, label: selectedKit?.detail6Label },
  ];

  return (
    <Dialog open={!!selectedKit} onOpenChange={() => onClose()}>
      <DialogContent className={`w-[95vw] sm:w-[70vw] md:w-[60vw] lg:w-[50vw] overflow-y-auto dialog-custom-color ${playerKitsList.length > 1 ? 'lg:max-h-[95vh]' : 'lg:max-h-[90vh]'}`}>
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
              <span className="truncate max-w-[120px] sm:max-w-none">{selectedKit?.name}</span>
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
            <div className="rounded-lg p-2 sm:p-4 min-h-[280px] sm:min-h-[480px] lg:min-h-[500px]">
              {selectedKit?.imageUrl ? (
                <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-5 h-full">
                  {/* Left detail images */}
                  <div 
                    className="col-span-1 flex flex-col gap-2 sm:gap-3"
                    onMouseLeave={() => handleDetailMouseLeave()}
                  >
                    {leftDetails.map((detail, index) => (
                      <div key={index} className="flex-1 min-h-0 relative group">
                        <div 
                          className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                            detail.url 
                              ? `hover:shadow-xl cursor-pointer transition-custom-color hover:z-30 z-0` 
                              : 'border-transparent'
                          }`}
                          style={{
                            transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                            borderColor: selectedDetail?.url === detail.url ? '#cd2127' : '#002f42',
                            transform: selectedDetail?.url === detail.url ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` : 'scale(1)',
                          }}
                          onMouseEnter={(e) => {
                            if (detail.url) {
                              e.currentTarget.style.transform = `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})`;
                              e.currentTarget.style.borderColor = '#cd2127';
                              handleDetailMouseEnter(detail, index, 'left');
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = '#002f42';
                          }}
                        >
                          {detail.url ? (
                            <>
                              <motion.img
                                layoutId={detail.url}
                                src={getImageUrl(detail.url)}
                                alt={detail.label || `Dettaglio ${index + 1}`}
                                className="max-w-full max-h-full object-contain p-1"
                                transition={{ 
                                  type: 'spring', 
                                  stiffness: 350, 
                                  damping: 30 
                                }}
                              />
                              {detail.label && (
                                <div 
                                  className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm py-0.5 px-1 rounded-b-lg transition-transform"
                                  style={{
                                    transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                                  }}
                                >
                                  <p 
                                    className="text-center text-foreground truncate transition-all"
                                    style={{
                                      fontSize: KIT_DETAIL_IMAGE_CONFIG.label.baseSize.mobile,
                                      transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                                    }}
                                  >
                                    {detail.label}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                              <Shirt className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Central main image */}
                  <div 
                    className="col-span-3 flex items-center justify-center rounded-lg overflow-hidden bg-muted border-2 relative"
                    style={{ borderColor: '#002f42' }}
                  >
                    {/* Main kit image */}
                    <img
                      src={getImageUrl(selectedKit.imageUrl)}
                      alt={selectedKit.name}
                      className={`max-w-full max-h-full object-contain transition-all duration-300 ${
                        selectedDetail ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                      }`}
                    />
                    
                    {/* Selected detail overlay with Framer Motion */}
                    {selectedDetail && (
                      <motion.img
                        key={selectedDetail.url}
                        layoutId={selectedDetail.url}
                        src={getImageUrl(selectedDetail.url)}
                        alt={selectedDetail.label || 'Dettaglio selezionato'}
                        className="absolute inset-0 m-auto max-w-full max-h-full object-contain p-4"
                        transition={{ 
                          type: 'spring', 
                          stiffness: 350, 
                          damping: 30
                        }}
                      />
                    )}
                    {selectedDetail?.label && (
                      <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm py-1 px-2 rounded-lg">
                        <p className="text-center text-foreground text-sm">
                          {selectedDetail.label}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Right detail images */}
                  <div 
                    className="col-span-1 flex flex-col gap-2 sm:gap-3"
                    onMouseLeave={() => handleDetailMouseLeave()}
                  >
                    {rightDetails.map((detail, index) => (
                      <div key={index} className="flex-1 min-h-0 relative group">
                        <div 
                          className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                            detail.url 
                              ? `hover:shadow-xl cursor-pointer transition-custom-color hover:z-30 z-0` 
                              : 'border-transparent'
                          }`}
                          style={{
                            transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                            borderColor: selectedDetail?.url === detail.url ? '#cd2127' : '#002f42',
                            transform: selectedDetail?.url === detail.url ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` : 'scale(1)',
                          }}
                          onMouseEnter={(e) => {
                            if (detail.url) {
                              e.currentTarget.style.transform = `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})`;
                              e.currentTarget.style.borderColor = '#cd2127';
                              handleDetailMouseEnter(detail, index, 'right');
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'scale(1)';
                            e.currentTarget.style.borderColor = '#002f42';
                          }}
                        >
                          {detail.url ? (
                            <>
                              <motion.img
                                layoutId={detail.url}
                                src={getImageUrl(detail.url)}
                                alt={detail.label || `Dettaglio ${index + 4}`}
                                className="max-w-full max-h-full object-contain p-1"
                                transition={{ 
                                  type: 'spring', 
                                  stiffness: 350, 
                                  damping: 30 
                                }}
                              />
                              {detail.label && (
                                <div 
                                  className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm py-0.5 px-1 rounded-b-lg transition-transform"
                                  style={{
                                    transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                                  }}
                                >
                                  <p 
                                    className="text-center text-foreground truncate transition-all"
                                    style={{
                                      fontSize: KIT_DETAIL_IMAGE_CONFIG.label.baseSize.mobile,
                                      transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                                    }}
                                  >
                                    {detail.label}
                                  </p>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                              <Shirt className="w-3 h-3 sm:w-4 sm:h-4" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center p-8 h-full flex items-center justify-center">
                  <div>
                    <Shirt className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Nessuna immagine presente
                    </p>
                  </div>
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
          <div className="flex items-center gap-3">
            {selectedKitPlayer && (
              <>
                <Avatar className="w-10 h-10 ring-2 avatar-custom-color">
                  <AvatarImage src={getImageUrl(selectedKitPlayer.image)} alt={getPlayerDisplayName(selectedKitPlayer)} />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(selectedKitPlayer.name[0] + (selectedKitPlayer.surname?.[0] || '')).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <strong className="text-lg">{getPlayerDisplayName(selectedKitPlayer)}</strong>
              </>
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
