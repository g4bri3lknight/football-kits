'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Kit, Player, PlayerKit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shirt, ThumbsUp, ThumbsDown } from 'lucide-react';
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

interface DetailInfo {
  kitId: string;
  detailNum: number;
  label: string | null;
}

const truncateName = (name: string, maxLength: number = 8) => {
  return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
};

// Funzione per generare o recuperare l'ID utente
const getUserId = (): string => {
  if (typeof window === 'undefined') return '';

  let userId = localStorage.getItem('kit-voter-id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('kit-voter-id', userId);
  }
  return userId;
};

export function KitDialog({
  selectedKit,
  selectedKitPlayer,
  playerKitsList,
  currentKitIndex,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
}: KitDialogProps) {
  // Dettaglio selezionato con click (mostrato al centro)
  const [selectedDetail, setSelectedDetail] = useState<DetailInfo | null>(null);
  // Dettaglio in hover (solo evidenziazione bordo)
  const [hoveredDetail, setHoveredDetail] = useState<DetailInfo | null>(null);
  // Traccia se il mouse è premuto (per evitare hover durante rotazione modello)
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userId, setUserId] = useState('');

  // Inizializza userId
  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // Event listener globali per tracciare lo stato del mouse
  useEffect(() => {
    const handleMouseDown = () => setIsMouseDown(true);
    const handleMouseUp = () => setIsMouseDown(false);

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Reset dettaglio selezionato quando cambia il kit
  useEffect(() => {
    setSelectedDetail(null);
    setHoveredDetail(null);
    setIsMouseDown(false);
  }, [selectedKit?.id]);

  // Carica i voti quando cambia il kit selezionato
  useEffect(() => {
    if (selectedKit?.id && userId) {
      fetch(`/api/kits/${selectedKit.id}/vote?userId=${userId}`)
        .then(res => res.json())
        .then(data => {
          setLikes(data.likes || 0);
          setDislikes(data.dislikes || 0);
          setUserVote(data.userVote || null);
        })
        .catch(console.error);
    }
  }, [selectedKit?.id, userId]);

  const prevKit = currentKitIndex > 0 && playerKitsList[currentKitIndex - 1]
    ? playerKitsList[currentKitIndex - 1].Kit
    : null;
  const nextKit = currentKitIndex < playerKitsList.length - 1 && playerKitsList[currentKitIndex + 1]
    ? playerKitsList[currentKitIndex + 1].Kit
    : null;

  const handleVote = async (voteType: 'like' | 'dislike') => {
    if (!selectedKit?.id || isVoting || !userId) return;

    setIsVoting(true);
    try {
      const res = await fetch(`/api/kits/${selectedKit.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType, userId }),
      });
      const data = await res.json();
      if (data.success) {
        setLikes(data.likes);
        setDislikes(data.dislikes);
        setUserVote(data.userVote);
      }
    } catch (error) {
      console.error('Error voting:', error);
    } finally {
      setIsVoting(false);
    }
  };

  // Click su un dettaglio - mostra al centro
  const handleDetailClick = useCallback((kitId: string, detailNum: number, label: string | null) => {
    // Se è già selezionato, lo deseleziona
    if (selectedDetail?.kitId === kitId && selectedDetail?.detailNum === detailNum) {
      setSelectedDetail(null);
    } else {
      setSelectedDetail({ kitId, detailNum, label });
    }
  }, [selectedDetail]);

  // Helper per ottenere l'URL del dettaglio con cache buster
  const getDetailUrl = (kitId: string, detailNum: number, updatedAt?: string | Date) => {
    const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
    return `/api/kits/${kitId}/detail/${detailNum}${cacheBuster}`;
  };

  const leftDetails = [
    { hasDetail: selectedKit?.hasDetail1, label: selectedKit?.detail1Label },
    { hasDetail: selectedKit?.hasDetail2, label: selectedKit?.detail2Label },
    { hasDetail: selectedKit?.hasDetail3, label: selectedKit?.detail3Label },
  ];

  const rightDetails = [
    { hasDetail: selectedKit?.hasDetail4, label: selectedKit?.detail4Label },
    { hasDetail: selectedKit?.hasDetail5, label: selectedKit?.detail5Label },
    { hasDetail: selectedKit?.hasDetail6, label: selectedKit?.detail6Label },
  ];

  // Helper per ottenere l'URL dell'immagine del kit
  const getKitImageUrl = (kit: Kit) => {
    if (kit.hasLogo) return `/api/kits/${kit.id}/logo`;
    if (kit.hasImage) return `/api/kits/${kit.id}/image`;
    return null;
  };

  return (
    <Dialog open={!!selectedKit} onOpenChange={() => onClose()}>
      <DialogContent 
        className="w-[95vw] h-[65vh] sm:w-[700px] sm:h-[700px] md:w-[900px] md:h-[800px] lg:w-[1050px] lg:h-[850px] overflow-hidden dialog-custom-color flex flex-col"
        style={{ cursor: isMouseDown ? 'none' : 'default' }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-2">
            {/* Kit precedente */}
            {playerKitsList.length > 1 && prevKit ? (
              <button
                onClick={onNavigatePrevious}
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                title={prevKit.name}
              >
                {getKitImageUrl(prevKit) ? (
                  <img
                    src={getKitImageUrl(prevKit)!}
                    alt={prevKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
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
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer mr-16"
                title={nextKit.name}
              >
                {getKitImageUrl(nextKit) ? (
                  <img
                    src={getKitImageUrl(nextKit)!}
                    alt={nextKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
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
              <div className="w-[80px] sm:w-[100px] flex-shrink-0 mr-16" />
            )}
          </div>

          {/* Indicatore di posizione */}
          {playerKitsList.length > 1 && (
            <div className="text-center text-sm text-muted-foreground mt-1">
              {currentKitIndex + 1} / {playerKitsList.length}
            </div>
          )}
        </DialogHeader>

        {/* Content principale */}
        <div className="rounded-lg p-2 sm:p-4 flex-1 min-h-0">
          <div className="grid grid-cols-5 gap-2 sm:gap-3 lg:gap-5 h-full">
            {/* Left detail images */}
            <div className="col-span-1 flex flex-col gap-2 sm:gap-3">
              {leftDetails.map((detail, index) => {
                const detailNum = index + 1;
                const detailUrl = selectedKit ? getDetailUrl(selectedKit.id, detailNum, selectedKit.updatedAt) : null;
                const isSelected = selectedDetail?.kitId === selectedKit?.id && selectedDetail?.detailNum === detailNum;
                const isHovered = hoveredDetail?.kitId === selectedKit?.id && hoveredDetail?.detailNum === detailNum;

                return (
                  <div key={index} className="flex-1 min-h-0 relative group">
                    <div
                      className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                        detail.hasDetail
                          ? `transition-custom-color hover:z-30 z-0`
                          : 'border-transparent'
                      }`}
                      style={{
                        transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                        borderColor: isSelected || isHovered ? '#cd2127' : '#002f42',
                        transform: isSelected || isHovered ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` : 'scale(1)',
                        cursor: isMouseDown ? 'none' : (detail.hasDetail ? 'pointer' : 'default'),
                      }}
                      onMouseEnter={() => {
                        // Non fare nulla se mouse premuto
                        if (isMouseDown || !detail.hasDetail || !selectedKit) return;
                        setHoveredDetail({ kitId: selectedKit.id, detailNum, label: detail.label || null });
                      }}
                      onMouseLeave={() => {
                        setHoveredDetail(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (detail.hasDetail && selectedKit) {
                          handleDetailClick(selectedKit.id, detailNum, detail.label || null);
                        }
                      }}
                    >
                      {detail.hasDetail && detailUrl ? (
                        <>
                          <motion.img
                            layoutId={`detail-${selectedKit?.id}-${detailNum}`}
                            src={detailUrl}
                            alt={detail.label || `Dettaglio ${detailNum}`}
                            className="max-w-full max-h-full object-contain p-1"
                            style={{
                              opacity: isSelected ? 0 : 1
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 350,
                              damping: 30
                            }}
                          />
                          {detail.label && (
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm py-0.5 px-1 rounded-b-lg"
                              style={{
                                opacity: isSelected ? 0 : 1,
                              }}
                            >
                              <p
                                className="text-center text-foreground truncate"
                                style={{
                                  fontSize: KIT_DETAIL_IMAGE_CONFIG.label.baseSize.mobile,
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
                );
              })}
            </div>

            {/* Central 3D Model */}
            <div
              className="col-span-3 flex items-center justify-center rounded-lg overflow-hidden bg-muted border-2 relative"
              style={{ borderColor: '#002f42' }}
              onClick={() => setSelectedDetail(null)}
            >
              {/* Selected detail overlay con AnimatePresence */}
              <AnimatePresence mode="popLayout">
                {selectedDetail && selectedKit ? (
                  <motion.img
                    key={`center-detail-${selectedDetail.kitId}-${selectedDetail.detailNum}`}
                    layoutId={`detail-${selectedDetail.kitId}-${selectedDetail.detailNum}`}
                    src={getDetailUrl(selectedDetail.kitId, selectedDetail.detailNum, selectedKit?.updatedAt)}
                    alt={selectedDetail.label || 'Dettaglio selezionato'}
                    className="absolute inset-0 m-auto max-w-full max-h-full object-contain p-4 z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{
                      layout: {
                        type: 'spring',
                        stiffness: 350,
                        damping: 30
                      },
                      opacity: { duration: 0.15 }
                    }}
                  />
                ) : null}
              </AnimatePresence>

              {/* Label del dettaglio selezionato */}
              <AnimatePresence>
                {selectedDetail && selectedDetail.label && (
                  <motion.div
                    key={`label-${selectedDetail.kitId}-${selectedDetail.detailNum}`}
                    className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm py-1 px-2 rounded-lg z-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <p className="text-center text-foreground text-sm">
                      {selectedDetail.label}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modello 3D o placeholder - visibile solo quando nessun dettaglio è selezionato */}
              {!selectedDetail && (
                selectedKit?.hasModel3D ? (
                  <KitViewer3D
                    kitId={selectedKit.id}
                    className="h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground/50">
                    <Shirt className="w-16 h-16" />
                  </div>
                )
              )}
            </div>

            {/* Right detail images */}
            <div className="col-span-1 flex flex-col gap-2 sm:gap-3">
              {rightDetails.map((detail, index) => {
                const detailNum = index + 4;
                const detailUrl = selectedKit ? getDetailUrl(selectedKit.id, detailNum, selectedKit.updatedAt) : null;
                const isSelected = selectedDetail?.kitId === selectedKit?.id && selectedDetail?.detailNum === detailNum;
                const isHovered = hoveredDetail?.kitId === selectedKit?.id && hoveredDetail?.detailNum === detailNum;

                return (
                  <div key={index} className="flex-1 min-h-0 relative group">
                    <div
                      className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                        detail.hasDetail
                          ? `transition-custom-color hover:z-30 z-0`
                          : 'border-transparent'
                      }`}
                      style={{
                        transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                        borderColor: isSelected || isHovered ? '#cd2127' : '#002f42',
                        transform: isSelected || isHovered ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` : 'scale(1)',
                        cursor: isMouseDown ? 'none' : (detail.hasDetail ? 'pointer' : 'default'),
                      }}
                      onMouseEnter={() => {
                        // Non fare nulla se mouse premuto
                        if (isMouseDown || !detail.hasDetail || !selectedKit) return;
                        setHoveredDetail({ kitId: selectedKit.id, detailNum, label: detail.label || null });
                      }}
                      onMouseLeave={() => {
                        setHoveredDetail(null);
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (detail.hasDetail && selectedKit) {
                          handleDetailClick(selectedKit.id, detailNum, detail.label || null);
                        }
                      }}
                    >
                      {detail.hasDetail && detailUrl ? (
                        <>
                          <motion.img
                            layoutId={`detail-${selectedKit?.id}-${detailNum}`}
                            src={detailUrl}
                            alt={detail.label || `Dettaglio ${detailNum}`}
                            className="max-w-full max-h-full object-contain p-1"
                            style={{
                              opacity: isSelected ? 0 : 1
                            }}
                            transition={{
                              type: 'spring',
                              stiffness: 350,
                              damping: 30
                            }}
                          />
                          {detail.label && (
                            <div
                              className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm py-0.5 px-1 rounded-b-lg"
                              style={{
                                opacity: isSelected ? 0 : 1,
                              }}
                            >
                              <p
                                className="text-center text-foreground truncate"
                                style={{
                                  fontSize: KIT_DETAIL_IMAGE_CONFIG.label.baseSize.mobile,
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
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer con player e voti */}
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex items-center gap-3">
            {selectedKitPlayer && (
              <>
                <Avatar className="w-10 h-10 ring-2 avatar-custom-color">
                  <AvatarImage
                    src={selectedKitPlayer.hasImage ? `/api/players/${selectedKitPlayer.id}/image?t=${selectedKitPlayer.updatedAt ? new Date(selectedKitPlayer.updatedAt).getTime() : Date.now()}` : undefined}
                    alt={getPlayerDisplayName(selectedKitPlayer)}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {(selectedKitPlayer.name[0] + (selectedKitPlayer.surname?.[0] || '')).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <strong className="text-lg">{getPlayerDisplayName(selectedKitPlayer)}</strong>
              </>
            )}
          </div>
          
          {/* Voti */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVote('like');
              }}
              disabled={isVoting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: userVote === 'like' ? '#002f42' : 'rgba(0, 102, 204, 0.15)',
                borderColor: userVote === 'like' ? '#004d6d' : 'rgba(0, 102, 204, 0.5)',
              }}
            >
              <ThumbsUp 
                className="w-5 h-5 transition-colors" 
                style={{ color: userVote === 'like' ? '#ffffff' : '#0066cc' }}
                fill={userVote === 'like' ? '#ffffff' : 'transparent'}
              />
              <span className="font-semibold" style={{ color: userVote === 'like' ? '#ffffff' : '#0066cc' }}>{likes}</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleVote('dislike');
              }}
              disabled={isVoting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 transition-all cursor-pointer disabled:opacity-50"
              style={{
                backgroundColor: userVote === 'dislike' ? '#cd2127' : 'rgba(205, 33, 39, 0.15)',
                borderColor: userVote === 'dislike' ? '#e04046' : 'rgba(205, 33, 39, 0.5)',
              }}
            >
              <ThumbsDown 
                className="w-5 h-5 transition-colors" 
                style={{ color: userVote === 'dislike' ? '#ffffff' : '#cd2127' }}
                fill={userVote === 'dislike' ? '#ffffff' : 'transparent'}
              />
              <span className="font-semibold" style={{ color: userVote === 'dislike' ? '#ffffff' : '#cd2127' }}>{dislikes}</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
