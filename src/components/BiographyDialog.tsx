'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Player } from '@/types';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FramerDialog } from '@/components/ui/framer-dialog';
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
  onOpen?: () => void;
}

// Helper per ottenere l'URL dell'immagine del giocatore
const getPlayerImageUrl = (playerId: string, updatedAt?: string | Date) => {
  const cacheBuster = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : '';
  return `/api/players/${playerId}/image${cacheBuster}`;
};

// Stagger animation for content
const contentVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.15
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 25
    }
  }
};

export function BiographyDialog({ selectedPlayer, onClose, onOpen }: BiographyDialogProps) {
  // Track when dialog opens
  useEffect(() => {
    if (selectedPlayer && onOpen) {
      onOpen();
    }
  }, [selectedPlayer, onOpen]);

  return (
    <FramerDialog open={!!selectedPlayer} onOpenChange={() => onClose()} className="w-[95vw] sm:max-w-4xl max-h-[85vh] sm:max-h-[90vh] flex flex-col dialog-custom-color overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <DialogTitle className="text-xl sm:text-2xl flex items-center gap-3">
              <motion.div
                initial={{ rotate: -10 }}
                animate={{ rotate: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <BookOpen className="w-8 h-8" />
              </motion.div>
              Biografia
            </DialogTitle>
          </motion.div>
        </DialogHeader>
        
        <motion.div 
          variants={contentVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col sm:flex-row gap-6 flex-1 overflow-hidden"
        >
          {/* Colonna sinistra: Immagine */}
          <motion.div variants={itemVariants} className="flex-shrink-0 flex sm:block justify-center">
            <div 
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden bg-muted border-2 border-primary/20 shadow-xl biography-img-custom-border"
            >
              {selectedPlayer?.hasImage ? (
                <img
                  src={getPlayerImageUrl(selectedPlayer.id, selectedPlayer.updatedAt)}
                  alt={getPlayerDisplayName(selectedPlayer)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                      {(selectedPlayer?.name[0] + (selectedPlayer?.surname?.[0] || '')).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </motion.div>

          {/* Colonna destra: Contenuto */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Nome e nazionalità */}
            <motion.div variants={itemVariants} className="text-center sm:text-left space-y-2 mb-4 flex-shrink-0">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                {selectedPlayer && getPlayerDisplayName(selectedPlayer)}
              </h2>
              {selectedPlayer?.Nation && (
                <Badge variant="secondary" className="text-sm items-center gap-2">
                  <Flag code={convertAlpha3ToAlpha2(selectedPlayer.Nation.code)} className="w-5 h-4 object-cover" />
                  {selectedPlayer.Nation.name}
                </Badge>
              )}
            </motion.div>

            <motion.div variants={itemVariants}>
              <Separator className="flex-shrink-0" />
            </motion.div>

            {/* Biografia con ScrollArea */}
            <motion.div variants={itemVariants} className="flex-1 overflow-hidden mt-4 min-h-0">
              <ScrollArea className="h-full">
                {selectedPlayer?.biography ? (
                  isUrl(selectedPlayer.biography) ? (
                    <div className="py-6">
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button
                          onClick={() => window.open(selectedPlayer.biography!, '_blank', 'noopener,noreferrer')}
                          size="lg"
                          className="gap-2"
                        >
                          <ExternalLink className="w-5 h-5" />
                          Vai alla biografia su Wikipedia
                        </Button>
                      </motion.div>
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
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                    >
                      <BookOpen className="w-12 h-12 mb-3 opacity-30" />
                    </motion.div>
                    <p className="text-center">Nessuna biografia disponibile</p>
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          </div>
        </motion.div>
        
        <motion.div 
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="flex justify-end pt-4 border-t flex-shrink-0"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button onClick={onClose}>
              Chiudi
            </Button>
          </motion.div>
        </motion.div>
      </FramerDialog>
  );
}
