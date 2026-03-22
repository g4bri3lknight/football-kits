'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Kit, Player, PlayerKit } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shirt, ThumbsUp, ThumbsDown } from 'lucide-react';
import KitViewer3D from '@/components/KitViewer3D';
import { KitComments } from '@/components/KitComments';
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

// Stato per l'hover (solo evidenziazione)
interface HoverDetail {
  url: string;
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

// Helper per ottenere l'URL dell'immagine con cache buster
const getKitImageUrl = (kitId: string, type: 'image' | 'logo' | 'model3d' | 'detail', detailNum?: number, updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  if (type === 'detail' && detailNum) {
    return `/api/kits/${kitId}/detail/${detailNum}${cacheBuster}`;
  }
  return `/api/kits/${kitId}/${type}${cacheBuster}`;
};

// Helper per ottenere l'URL dell'immagine del giocatore
const getPlayerImageUrl = (playerId: string, updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/players/${playerId}/image${cacheBuster}`;
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
  // Dettaglio selezionato per l'animazione (click)
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  // Dettaglio in hover per l'evidenziazione
  const [hoveredDetail, setHoveredDetail] = useState<HoverDetail | null>(null);
  
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userId, setUserId] = useState('');
  const [isMouseDown, setIsMouseDown] = useState(false);

  // Inizializza userId
  useEffect(() => {
    setUserId(getUserId());
  }, []);

  // Track mouse down state for cursor visibility during rotation
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

  // Reset del dettaglio selezionato quando cambia il kit
  useEffect(() => {
    setSelectedDetail(null);
    setHoveredDetail(null);
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
    if (!selectedKit?.id || isVoting || !userId) {
      return;
    }
    
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

  // Hover: solo evidenziazione visiva
  const handleDetailMouseEnter = useCallback((detail: { url: string; label: string | null }) => {
    if (detail.url && !isMouseDown) {
      setHoveredDetail(detail);
    }
  }, [isMouseDown]);

  const handleDetailMouseLeave = useCallback(() => {
    setHoveredDetail(null);
  }, []);

  // Click: attiva l'animazione
  const handleDetailClick = useCallback((detail: { url: string; label: string | null }, index: number, side: 'left' | 'right') => {
    if (detail.url) {
      // Se è già selezionato, deseleziona
      if (selectedDetail?.url === detail.url) {
        setSelectedDetail(null);
      } else {
        setSelectedDetail({ url: detail.url, label: detail.label, index, side });
      }
    }
  }, [selectedDetail]);

  // Chiudi il dettaglio cliccando sull'area centrale
  const handleCentralAreaClick = useCallback(() => {
    setSelectedDetail(null);
  }, []);

  // Build detail arrays using API URLs
  const leftDetails = selectedKit ? [
    { url: selectedKit.hasDetail1 ? getKitImageUrl(selectedKit.id, 'detail', 1, selectedKit.updatedAt) : null, label: selectedKit.detail1Label },
    { url: selectedKit.hasDetail2 ? getKitImageUrl(selectedKit.id, 'detail', 2, selectedKit.updatedAt) : null, label: selectedKit.detail2Label },
    { url: selectedKit.hasDetail3 ? getKitImageUrl(selectedKit.id, 'detail', 3, selectedKit.updatedAt) : null, label: selectedKit.detail3Label },
  ] : [];

  const rightDetails = selectedKit ? [
    { url: selectedKit.hasDetail4 ? getKitImageUrl(selectedKit.id, 'detail', 4, selectedKit.updatedAt) : null, label: selectedKit.detail4Label },
    { url: selectedKit.hasDetail5 ? getKitImageUrl(selectedKit.id, 'detail', 5, selectedKit.updatedAt) : null, label: selectedKit.detail5Label },
    { url: selectedKit.hasDetail6 ? getKitImageUrl(selectedKit.id, 'detail', 6, selectedKit.updatedAt) : null, label: selectedKit.detail6Label },
  ] : [];

  return (
    <Dialog open={!!selectedKit} onOpenChange={() => onClose()}>
      <DialogContent 
        key={selectedKit?.id || 'no-kit'}
        className="w-[95vw] sm:w-[700px] md:w-[900px] lg:w-[1050px] max-h-[90vh] overflow-y-auto overflow-x-hidden dialog-custom-color flex flex-col"
        style={{ cursor: isMouseDown ? 'none' : 'default' }}
      >
        <DialogHeader>
          <div className="flex items-center justify-between w-full gap-2">
            {/* Kit precedente */}
            {playerKitsList.length > 1 && prevKit ? (
              <button
                onClick={(e) => { e.stopPropagation(); onNavigatePrevious(); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                title={prevKit.name}
              >
                {prevKit.hasLogo ? (
                  <img
                    src={getKitImageUrl(prevKit.id, 'logo', undefined, prevKit.updatedAt)}
                    alt={prevKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                ) : prevKit.hasImage ? (
                  <img
                    src={getKitImageUrl(prevKit.id, 'image', undefined, prevKit.updatedAt)}
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
                onClick={(e) => { e.stopPropagation(); onNavigateNext(); }}
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer mr-16"
                title={nextKit.name}
              >
                {nextKit.hasLogo ? (
                  <img
                    src={getKitImageUrl(nextKit.id, 'logo', undefined, nextKit.updatedAt)}
                    alt={nextKit.name}
                    className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
                  />
                ) : nextKit.hasImage ? (
                  <img
                    src={getKitImageUrl(nextKit.id, 'image', undefined, nextKit.updatedAt)}
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
        <div className="kit-dialog-grid grid grid-cols-5 gap-2 sm:gap-3 lg:gap-5 rounded-lg p-2 sm:p-4">
            {/* Left detail images */}
            <div className="col-span-1 flex flex-col gap-2 sm:gap-3">
              {leftDetails.map((detail, index) => (
                <div key={index} className="flex-1 min-h-0 relative group">
                  <div 
                    className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                      detail.url 
                        ? 'hover:shadow-xl cursor-pointer transition-custom-color hover:z-30 z-0' 
                        : 'border-transparent'
                    }`}
                    style={{
                      transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                      // Hover state: evidenziazione bordo e scale
                      borderColor: hoveredDetail?.url === detail.url 
                        ? '#cd2127' 
                        : (selectedDetail?.url === detail.url ? '#cd2127' : '#002f42'),
                      transform: hoveredDetail?.url === detail.url 
                        ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` 
                        : 'scale(1)',
                      cursor: isMouseDown ? 'none' : 'pointer',
                    }}
                    onMouseEnter={() => {
                      if (detail.url) {
                        handleDetailMouseEnter(detail);
                      }
                    }}
                    onMouseLeave={() => {
                      handleDetailMouseLeave();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDetailClick(detail, index, 'left');
                    }}
                  >
                    {detail.url ? (
                      <>
                        <motion.img
                          layoutId={detail.url}
                          src={detail.url}
                          alt={detail.label || `Dettaglio ${index + 1}`}
                          className="max-w-full max-h-full object-contain p-1"
                          style={{ 
                            // Nascondi l'immagine nella thumbnail quando è selezionata
                            opacity: selectedDetail?.url === detail.url ? 0 : 1 
                          }}
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
                              opacity: selectedDetail?.url === detail.url ? 0 : 1,
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
            
            {/* Central 3D Model */}
            <div 
              className="col-span-3 flex items-center justify-center rounded-lg overflow-hidden bg-muted border-2 relative cursor-pointer"
              style={{ borderColor: '#002f42' }}
              onClick={handleCentralAreaClick}
            >
              {/* Selected detail overlay - animazione solo al click */}
              <AnimatePresence>
                {selectedDetail ? (
                  <>
                    <motion.img
                      key={selectedDetail.url}
                      layoutId={selectedDetail.url}
                      src={selectedDetail.url}
                      alt={selectedDetail.label || 'Dettaglio selezionato'}
                      className="absolute inset-0 m-auto max-w-full max-h-full object-contain p-4 z-10"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      transition={{ 
                        type: 'spring', 
                        stiffness: 350, 
                        damping: 30
                      }}
                    />
                    {selectedDetail.label && (
                      <div className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm py-1 px-2 rounded-lg z-20">
                        <p className="text-center text-foreground text-sm">
                          {selectedDetail.label}
                        </p>
                      </div>
                    )}
                  </>
                ) : selectedKit?.hasModel3D ? (
                  <KitViewer3D
                    modelUrl={getKitImageUrl(selectedKit.id, 'model3d', undefined, selectedKit.updatedAt)}
                    className="h-full"
                  />
                ) : selectedKit?.hasImage ? (
                  <img
                    src={getKitImageUrl(selectedKit.id, 'image', undefined, selectedKit.updatedAt)}
                    alt={selectedKit.name}
                    className="max-w-full max-h-full object-contain"
                  />
                ) : null}
              </AnimatePresence>
            </div>
            
            {/* Right detail images */}
            <div className="col-span-1 flex flex-col gap-2 sm:gap-3">
              {rightDetails.map((detail, index) => (
                <div key={index} className="flex-1 min-h-0 relative group">
                  <div 
                    className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                      detail.url 
                        ? 'hover:shadow-xl cursor-pointer transition-custom-color hover:z-30 z-0' 
                        : 'border-transparent'
                    }`}
                    style={{
                      transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                      // Hover state: evidenziazione bordo e scale
                      borderColor: hoveredDetail?.url === detail.url 
                        ? '#cd2127' 
                        : (selectedDetail?.url === detail.url ? '#cd2127' : '#002f42'),
                      transform: hoveredDetail?.url === detail.url 
                        ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` 
                        : 'scale(1)',
                      cursor: isMouseDown ? 'none' : 'pointer',
                    }}
                    onMouseEnter={() => {
                      if (detail.url) {
                        handleDetailMouseEnter(detail);
                      }
                    }}
                    onMouseLeave={() => {
                      handleDetailMouseLeave();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDetailClick(detail, index, 'right');
                    }}
                  >
                    {detail.url ? (
                      <>
                        <motion.img
                          layoutId={detail.url}
                          src={detail.url}
                          alt={detail.label || `Dettaglio ${index + 4}`}
                          className="max-w-full max-h-full object-contain p-1"
                          style={{ 
                            opacity: selectedDetail?.url === detail.url ? 0 : 1 
                          }}
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
                              opacity: selectedDetail?.url === detail.url ? 0 : 1,
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

        {/* Footer con player e voti */}
        <div className="flex justify-between items-center pt-3 border-t">
          <div className="flex items-center gap-3">
            {selectedKitPlayer && (
              <>
                <Avatar className="w-10 h-10 ring-2 avatar-custom-color">
                  <AvatarImage 
                    src={selectedKitPlayer.hasImage ? getPlayerImageUrl(selectedKitPlayer.id, selectedKitPlayer.updatedAt) : undefined} 
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
                backgroundColor: userVote === 'like' ? '#002f42' : 'rgba(0, 47, 66, 0.15)',
                borderColor: userVote === 'like' ? '#004d6d' : 'rgba(0, 47, 66, 0.5)',
              }}
            >
              <ThumbsUp 
                className="w-5 h-5 transition-colors" 
                style={{ color: userVote === 'like' ? '#ffffff' : '#002f42' }}
                fill={userVote === 'like' ? '#ffffff' : 'transparent'}
              />
              <span className="font-semibold" style={{ color: userVote === 'like' ? '#ffffff' : '#002f42' }}>{likes}</span>
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

        {/* Sezione Commenti */}
        {selectedKit && (
          <KitComments kitId={selectedKit.id} />
        )}
      </DialogContent>
    </Dialog>
  );
}
