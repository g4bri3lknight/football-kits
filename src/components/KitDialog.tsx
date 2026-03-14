'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Kit, Player, PlayerKit } from '@/types';
import { getImageUrl } from '@/lib/image-url';
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

interface SelectedDetail {
  url: string;
  label: string | null;
  index: number;
  side: 'left' | 'right';
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
  const [selectedDetail, setSelectedDetail] = useState<SelectedDetail | null>(null);
  const clearDetailTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userId, setUserId] = useState('');

  // Inizializza userId
  useEffect(() => {
    setUserId(getUserId());
  }, []);

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
    console.log('handleVote called:', voteType, 'userId:', userId, 'selectedKit:', selectedKit?.id);
    if (!selectedKit?.id || isVoting || !userId) {
      console.log('Early return - missing data');
      return;
    }
    
    setIsVoting(true);
    try {
      console.log('Sending vote request...');
      const res = await fetch(`/api/kits/${selectedKit.id}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voteType, userId }),
      });
      const data = await res.json();
      console.log('Vote response:', data);
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

  const handleDetailPointerEnter = useCallback((detail: { url: string; label: string | null }, index: number, side: 'left' | 'right') => {
    if (detail.url) {
      if (clearDetailTimeoutRef.current) {
        clearTimeout(clearDetailTimeoutRef.current);
        clearDetailTimeoutRef.current = null;
      }
      
      const newDetail: SelectedDetail = { url: detail.url, label: detail.label, index, side };
      setSelectedDetail(newDetail);
    }
  }, []);

  const handleColumnPointerLeave = useCallback(() => {
    clearDetailTimeoutRef.current = setTimeout(() => {
      setSelectedDetail(null);
      clearDetailTimeoutRef.current = null;
    }, 100);
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
      <DialogContent className="w-[95vw] sm:w-[700px] md:w-[900px] lg:w-[1050px] sm:h-[700px] md:h-[800px] lg:h-[850px] overflow-hidden dialog-custom-color flex flex-col">
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
                className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer mr-16"
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
            <div 
              className="col-span-1 flex flex-col gap-2 sm:gap-3"
              onPointerLeave={() => handleColumnPointerLeave()}
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
                    onPointerEnter={(e) => {
                      if (detail.url) {
                        e.currentTarget.style.transform = `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})`;
                        e.currentTarget.style.borderColor = '#cd2127';
                        handleDetailPointerEnter(detail, index, 'left');
                      }
                    }}
                  >
                    {detail.url ? (
                      <>
                        <motion.img
                          layoutId={detail.url}
                          src={getImageUrl(detail.url)}
                          alt={detail.label || `Dettaglio ${index + 1}`}
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
            
            {/* Central 3D Model */}
            <div 
              className="col-span-3 flex items-center justify-center rounded-lg overflow-hidden bg-muted border-2 relative"
              style={{ borderColor: '#002f42' }}
              onPointerEnter={() => {
                if (clearDetailTimeoutRef.current) {
                  clearTimeout(clearDetailTimeoutRef.current);
                  clearDetailTimeoutRef.current = null;
                }
                setSelectedDetail(null);
              }}
            >
              {/* Selected detail overlay */}
              {selectedDetail ? (
                <>
                  <motion.img
                    key={selectedDetail.url}
                    layoutId={selectedDetail.url}
                    src={getImageUrl(selectedDetail.url)}
                    alt={selectedDetail.label || 'Dettaglio selezionato'}
                    className="absolute inset-0 m-auto max-w-full max-h-full object-contain p-4 z-10"
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
              ) : (
                <KitViewer3D
                  modelUrl={selectedKit?.model3DUrl}
                  className="h-full"
                />
              )}
            </div>
            
            {/* Right detail images */}
            <div 
              className="col-span-1 flex flex-col gap-2 sm:gap-3"
              onPointerLeave={() => handleColumnPointerLeave()}
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
                    onPointerEnter={(e) => {
                      if (detail.url) {
                        e.currentTarget.style.transform = `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})`;
                        e.currentTarget.style.borderColor = '#cd2127';
                        handleDetailPointerEnter(detail, index, 'right');
                      }
                    }}
                  >
                    {detail.url ? (
                      <>
                        <motion.img
                          layoutId={detail.url}
                          src={getImageUrl(detail.url)}
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
        </div>

        {/* Footer con player e voti */}
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
      </DialogContent>
    </Dialog>
  );
}
