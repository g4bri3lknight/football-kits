'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Kit, Player, PlayerKit } from '@/types';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FramerDialog } from '@/components/ui/framer-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Shirt, ThumbsUp, ThumbsDown, Share2, Facebook, Twitter, MessageCircle, Link2, Check, ChevronLeft, ChevronRight } from 'lucide-react';
import KitViewer3D from '@/components/KitViewer3D';
import { KitComments } from '@/components/KitComments';
import { getPlayerDisplayName } from '@/lib/player-utils';
import { KIT_DETAIL_IMAGE_CONFIG } from '@/config/kit-viewer.config';
import { AnimatedCounter, dropdownVariants } from '@/components/ui/animated-dialog';

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

interface HoverDetail {
  url: string;
  label: string | null;
}

const truncateName = (name: string, maxLength: number = 8) => {
  return name.length > maxLength ? name.slice(0, maxLength) + '...' : name;
};

const getUserId = (): string => {
  if (typeof window === 'undefined') return '';
  let userId = localStorage.getItem('kit-voter-id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('kit-voter-id', userId);
  }
  return userId;
};

const getKitImageUrl = (kitId: string, type: 'image' | 'logo' | 'model3d' | 'detail', detailNum?: number, updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  if (type === 'detail' && detailNum) {
    return `/api/kits/${kitId}/detail/${detailNum}${cacheBuster}`;
  }
  return `/api/kits/${kitId}/${type}${cacheBuster}`;
};

const getPlayerImageUrl = (playerId: string, updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/players/${playerId}/image${cacheBuster}`;
};

// Content stagger animation
const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 350, damping: 28 } }
};

// Vote button animation
const voteButtonVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.08 },
  tap: { scale: 0.95 }
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
  const [hoveredDetail, setHoveredDetail] = useState<HoverDetail | null>(null);
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [userId, setUserId] = useState('');
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => { setUserId(getUserId()); }, []);

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

  useEffect(() => {
    setSelectedDetail(null);
    setHoveredDetail(null);
  }, [selectedKit?.id]);

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
    ? playerKitsList[currentKitIndex - 1].Kit : null;
  const nextKit = currentKitIndex < playerKitsList.length - 1 && playerKitsList[currentKitIndex + 1] 
    ? playerKitsList[currentKitIndex + 1].Kit : null;

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

  const getShareUrl = () => {
    if (typeof window !== 'undefined' && selectedKit?.id) {
      return `${window.location.origin}/share/${selectedKit.id}`;
    }
    return '';
  };

  const getDirectUrl = () => {
    if (typeof window !== 'undefined' && selectedKit?.id) {
      return `${window.location.origin}?kit=${selectedKit.id}`;
    }
    return '';
  };

  const getShareTitle = () => {
    const playerName = selectedKitPlayer ? getPlayerDisplayName(selectedKitPlayer) : '';
    const kitName = selectedKit?.name || '';
    const team = selectedKit?.team || '';
    return `${playerName} - ${kitName} ${team} | GK Retro Kits`.trim();
  };

  const shareOnFacebook = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl())}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const shareOnTwitter = () => {
    window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl())}&text=${encodeURIComponent(getShareTitle())}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const shareOnWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(getShareTitle())}%20${encodeURIComponent(getShareUrl())}`, '_blank');
    setShowShareMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(getDirectUrl());
      setCopiedLink(true);
      setTimeout(() => {
        setCopiedLink(false);
        setShowShareMenu(false);
      }, 2000);
    } catch (err) {
      console.error('Errore copia link:', err);
    }
  };

  const handleDetailMouseEnter = useCallback((detail: { url: string; label: string | null }) => {
    if (detail.url && !isMouseDown) setHoveredDetail(detail);
  }, [isMouseDown]);

  const handleDetailMouseLeave = useCallback(() => setHoveredDetail(null), []);

  const handleDetailClick = useCallback((detail: { url: string; label: string | null }, index: number, side: 'left' | 'right') => {
    if (detail.url) {
      if (selectedDetail?.url === detail.url) {
        setSelectedDetail(null);
      } else {
        setSelectedDetail({ url: detail.url, label: detail.label, index, side });
      }
    }
  }, [selectedDetail]);

  const handleCentralAreaClick = useCallback(() => setSelectedDetail(null), []);

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
    <FramerDialog 
      open={!!selectedKit} 
      onOpenChange={() => onClose()}
      className="w-[95vw] sm:w-[700px] md:w-[900px] lg:w-[1050px] max-h-[90vh] dialog-custom-color flex flex-col"
      style={{ cursor: isMouseDown ? 'none' : 'default' }}
    >
        <DialogHeader className="flex-shrink-0">
            <motion.div 
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              className="flex items-center justify-between w-full gap-2"
            >
              {/* Kit precedente */}
              {playerKitsList.length > 1 && prevKit ? (
                <motion.button
                  variants={voteButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={(e) => { e.stopPropagation(); onNavigatePrevious(); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                  title={prevKit.name}
                >
                  <ChevronLeft className="w-4 h-4 text-muted-foreground" />
                  {prevKit.hasLogo ? (
                    <img src={getKitImageUrl(prevKit.id, 'logo', undefined, prevKit.updatedAt)} alt={prevKit.name} className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
                  ) : prevKit.hasImage ? (
                    <img src={getKitImageUrl(prevKit.id, 'image', undefined, prevKit.updatedAt)} alt={prevKit.name} className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded" />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-muted rounded flex items-center justify-center">
                      <Shirt className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                    {truncateName(prevKit.name)}
                  </span>
                </motion.button>
              ) : (
                <div className="w-[80px] sm:w-[100px] flex-shrink-0" />
              )}

              {/* Titolo centrato */}
              <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2 sm:gap-3 flex-1 justify-center flex-wrap">
                <span className="truncate max-w-[120px] sm:max-w-none">{selectedKit?.name}</span>
              </DialogTitle>

              {/* Kit successivo */}
              {playerKitsList.length > 1 && nextKit ? (
                <motion.button
                  variants={voteButtonVariants}
                  initial="initial"
                  whileHover="hover"
                  whileTap="tap"
                  onClick={(e) => { e.stopPropagation(); onNavigateNext(); }}
                  className="flex-shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-muted transition-colors cursor-pointer mr-16"
                  title={nextKit.name}
                >
                  <span className="text-xs text-muted-foreground whitespace-nowrap hidden sm:inline">
                    {truncateName(nextKit.name)}
                  </span>
                  {nextKit.hasLogo ? (
                    <img src={getKitImageUrl(nextKit.id, 'logo', undefined, nextKit.updatedAt)} alt={nextKit.name} className="w-6 h-6 sm:w-7 sm:h-7 object-contain" />
                  ) : nextKit.hasImage ? (
                    <img src={getKitImageUrl(nextKit.id, 'image', undefined, nextKit.updatedAt)} alt={nextKit.name} className="w-6 h-6 sm:w-7 sm:h-7 object-cover rounded" />
                  ) : (
                    <div className="w-6 h-6 sm:w-7 sm:h-7 bg-muted rounded flex items-center justify-center">
                      <Shirt className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
                    </div>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              ) : (
                <div className="w-[80px] sm:w-[100px] flex-shrink-0 mr-16" />
              )}
            </motion.div>

            {playerKitsList.length > 1 && (
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="text-center text-sm text-muted-foreground mt-1"
              >
                {currentKitIndex + 1} / {playerKitsList.length}
              </motion.div>
            )}
          </DialogHeader>

          {/* Scrollable content area */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 -mr-1">
              {/* Content principale */}
              <motion.div 
                variants={contentVariants}
                initial="hidden"
                animate="visible"
                className="kit-dialog-grid grid grid-cols-5 gap-2 sm:gap-3 lg:gap-5 rounded-lg p-2 sm:p-4"
              >
                {/* Left details */}
                <div className="col-span-1 flex flex-col gap-2 sm:gap-3">
                  {leftDetails.map((detail, index) => (
                    <motion.div 
                      key={index} 
                      variants={itemVariants}
                      className="flex-1 min-h-0 relative group"
                    >
                      <div 
                        className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                          detail.url ? 'hover:shadow-xl cursor-pointer transition-custom-color hover:z-30 z-0' : 'border-transparent'
                        }`}
                        style={{
                          transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                          borderColor: hoveredDetail?.url === detail.url 
                            ? '#cd2127' 
                            : (selectedDetail?.url === detail.url ? '#cd2127' : '#002f42'),
                          transform: hoveredDetail?.url === detail.url 
                            ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` 
                            : 'scale(1)',
                          cursor: isMouseDown ? 'none' : 'pointer',
                        }}
                        onMouseEnter={() => { if (detail.url) handleDetailMouseEnter(detail); }}
                        onMouseLeave={() => handleDetailMouseLeave()}
                        onClick={(e) => { e.stopPropagation(); handleDetailClick(detail, index, 'left'); }}
                      >
                        {detail.url ? (
                          <>
                            <motion.img
                              layoutId={detail.url}
                              src={detail.url}
                              alt={detail.label || `Dettaglio ${index + 1}`}
                              className="max-w-full max-h-full object-contain p-1"
                              style={{ opacity: selectedDetail?.url === detail.url ? 0 : 1 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                            {detail.label && (
                              <div 
                                className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm py-0.5 px-1 rounded-b-lg transition-transform"
                                style={{
                                  transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                                  opacity: selectedDetail?.url === detail.url ? 0 : 1,
                                }}
                              >
                                <p className="text-center text-foreground truncate text-xs">
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
                    </motion.div>
                  ))}
                </div>
                
                {/* Central content */}
                <div 
                  className="col-span-3 flex items-center justify-center rounded-lg overflow-hidden bg-muted border-2 relative cursor-pointer"
                  style={{ borderColor: '#002f42' }}
                  onClick={handleCentralAreaClick}
                >
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
                          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                        />
                        {selectedDetail.label && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-2 left-2 right-2 bg-background/80 backdrop-blur-sm py-1 px-2 rounded-lg z-20"
                          >
                            <p className="text-center text-foreground text-sm">
                              {selectedDetail.label}
                            </p>
                          </motion.div>
                        )}
                      </>
                    ) : selectedKit?.hasModel3D ? (
                      <KitViewer3D modelUrl={getKitImageUrl(selectedKit.id, 'model3d', undefined, selectedKit.updatedAt)} className="h-full" />
                    ) : selectedKit?.hasImage ? (
                      <motion.img
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                        src={getKitImageUrl(selectedKit.id, 'image', undefined, selectedKit.updatedAt)}
                        alt={selectedKit.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : null}
                  </AnimatePresence>
                </div>
                
                {/* Right details */}
                <div className="col-span-1 flex flex-col gap-2 sm:gap-3">
                  {rightDetails.map((detail, index) => (
                    <motion.div 
                      key={index} 
                      variants={itemVariants}
                      className="flex-1 min-h-0 relative group"
                    >
                      <div 
                        className={`absolute inset-0 rounded-lg bg-muted border-2 flex items-center justify-center transition-all overflow-hidden ${
                          detail.url ? 'hover:shadow-xl cursor-pointer transition-custom-color hover:z-30 z-0' : 'border-transparent'
                        }`}
                        style={{
                          transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                          borderColor: hoveredDetail?.url === detail.url 
                            ? '#cd2127' 
                            : (selectedDetail?.url === detail.url ? '#cd2127' : '#002f42'),
                          transform: hoveredDetail?.url === detail.url 
                            ? `scale(${KIT_DETAIL_IMAGE_CONFIG.hover.scale})` 
                            : 'scale(1)',
                          cursor: isMouseDown ? 'none' : 'pointer',
                        }}
                        onMouseEnter={() => { if (detail.url) handleDetailMouseEnter(detail); }}
                        onMouseLeave={() => handleDetailMouseLeave()}
                        onClick={(e) => { e.stopPropagation(); handleDetailClick(detail, index, 'right'); }}
                      >
                        {detail.url ? (
                          <>
                            <motion.img
                              layoutId={detail.url}
                              src={detail.url}
                              alt={detail.label || `Dettaglio ${index + 4}`}
                              className="max-w-full max-h-full object-contain p-1"
                              style={{ opacity: selectedDetail?.url === detail.url ? 0 : 1 }}
                              transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                            />
                            {detail.label && (
                              <div 
                                className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm py-0.5 px-1 rounded-b-lg transition-transform"
                                style={{
                                  transitionDuration: `${KIT_DETAIL_IMAGE_CONFIG.hover.transitionDuration}ms`,
                                  opacity: selectedDetail?.url === detail.url ? 0 : 1,
                                }}
                              >
                                <p className="text-center text-foreground truncate text-xs">
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
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Footer */}
              <motion.div 
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="flex justify-between items-center pt-3 border-t px-2"
              >
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
                
                {/* Voti e Condivisione */}
                <div className="flex items-center gap-2 sm:gap-3">
                  <motion.button
                    variants={voteButtonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('like'); }}
                    disabled={isVoting}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-lg border-2 transition-all cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: userVote === 'like' ? '#002f42' : 'rgba(0, 47, 66, 0.15)',
                      borderColor: userVote === 'like' ? '#004d6d' : 'rgba(0, 47, 66, 0.5)',
                    }}
                  >
                    <ThumbsUp
                      className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
                      style={{ color: userVote === 'like' ? '#ffffff' : '#002f42' }}
                      fill={userVote === 'like' ? '#ffffff' : 'transparent'}
                    />
                    <AnimatedCounter value={likes} className="font-semibold text-sm sm:text-base" style={{ color: userVote === 'like' ? '#ffffff' : '#002f42' }} />
                  </motion.button>
                  
                  <motion.button
                    variants={voteButtonVariants}
                    initial="initial"
                    whileHover="hover"
                    whileTap="tap"
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleVote('dislike'); }}
                    disabled={isVoting}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-lg border-2 transition-all cursor-pointer disabled:opacity-50"
                    style={{
                      backgroundColor: userVote === 'dislike' ? '#cd2127' : 'rgba(205, 33, 39, 0.15)',
                      borderColor: userVote === 'dislike' ? '#e04046' : 'rgba(205, 33, 39, 0.5)',
                    }}
                  >
                    <ThumbsDown
                      className="w-4 h-4 sm:w-5 sm:h-5 transition-colors"
                      style={{ color: userVote === 'dislike' ? '#ffffff' : '#cd2127' }}
                      fill={userVote === 'dislike' ? '#ffffff' : 'transparent'}
                    />
                    <AnimatedCounter value={dislikes} className="font-semibold text-sm sm:text-base" style={{ color: userVote === 'dislike' ? '#ffffff' : '#cd2127' }} />
                  </motion.button>

                  {/* Share button */}
                  <div className="relative">
                    <motion.button
                      variants={voteButtonVariants}
                      initial="initial"
                      whileHover="hover"
                      whileTap="tap"
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3 h-10 rounded-lg border-2 transition-all cursor-pointer bg-muted/50 hover:bg-muted border-muted-foreground/30 hover:border-muted-foreground/50"
                      title="Condividi"
                    >
                      <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                      <span className="hidden sm:inline text-sm font-medium text-muted-foreground">Condividi</span>
                    </motion.button>

                    <AnimatePresence>
                      {showShareMenu && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={(e) => { e.stopPropagation(); setShowShareMenu(false); }}
                          />
                          <motion.div
                            variants={dropdownVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="absolute right-0 bottom-full mb-2 bg-card border border-border rounded-lg shadow-lg p-2 min-w-[160px] z-50"
                          >
                            {[
                              { icon: Facebook, label: 'Facebook', color: 'text-[#1877F2]', onClick: shareOnFacebook },
                              { icon: Twitter, label: 'Twitter / X', color: 'text-[#1DA1F2]', onClick: shareOnTwitter },
                              { icon: MessageCircle, label: 'WhatsApp', color: 'text-[#25D366]', onClick: shareOnWhatsApp },
                            ].map((item, i) => (
                              <motion.button
                                key={item.label}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={(e) => { e.stopPropagation(); item.onClick(); }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                              >
                                <item.icon className={`w-5 h-5 ${item.color}`} />
                                <span className="text-sm font-medium">{item.label}</span>
                              </motion.button>
                            ))}
                            <div className="border-t border-border my-1" />
                            <motion.button
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: 0.15 }}
                              onClick={(e) => { e.stopPropagation(); copyLink(); }}
                              className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
                            >
                              {copiedLink ? (
                                <>
                                  <Check className="w-5 h-5 text-emerald-500" />
                                  <span className="text-sm font-medium text-emerald-500">Copiato!</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-5 h-5 text-muted-foreground" />
                                  <span className="text-sm font-medium">Copia link</span>
                                </>
                              )}
                            </motion.button>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>

            {/* Comments */}
            {selectedKit && (
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="px-2"
              >
                <KitComments kitId={selectedKit.id} />
              </motion.div>
            )}
          </div>
    </FramerDialog>
  );
}
