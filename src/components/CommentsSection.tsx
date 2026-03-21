'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MessageCircle, Send, Search, Loader2, X, Reply, Plus, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Reply {
  id: string;
  author: string;
  content: string;
  userId: string;
  kitId: string | null;
  parentId: string;
  createdAt: string;
  updatedAt: string;
  Kit?: {
    id: string;
    name: string;
    team: string;
    type: string;
  } | null;
}

interface Comment {
  id: string;
  author: string;
  content: string;
  userId: string;
  kitId: string | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  Kit?: {
    id: string;
    name: string;
    team: string;
    type: string;
  } | null;
  Replies?: Reply[];
}

interface Kit {
  id: string;
  name: string;
  team: string;
  type: string;
}

// Genera o recupera l'ID utente
const getUserId = (): string => {
  if (typeof window === 'undefined') return '';
  
  let userId = localStorage.getItem('comment-user-id');
  if (!userId) {
    userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('comment-user-id', userId);
  }
  return userId;
};

export function CommentsSection() {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [kitSearch, setKitSearch] = useState('');
  const [showKitSelect, setShowKitSelect] = useState(false);

  // Reply state
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [replyAuthor, setReplyAuthor] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Edit state
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // User state
  const [userId, setUserId] = useState('');
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [adminToken, setAdminToken] = useState<string | null>(null);

  useEffect(() => {
    setUserId(getUserId());
    checkAdminStatus();
    fetchData();
  }, []);

  const checkAdminStatus = () => {
    if (typeof window === 'undefined') return;
    
    // Controlla sessionStorage
    const sessionToken = sessionStorage.getItem('admin-auth-token');
    if (sessionToken) {
      console.log('Found token in sessionStorage:', sessionToken.substring(0, 20) + '...');
      setAdminToken(sessionToken);
      setUserIsAdmin(true);
      return;
    }
    
    // Controlla cookie
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const trimmedCookie = cookie.trim();
      if (trimmedCookie.startsWith('admin-auth-token=')) {
        const value = trimmedCookie.substring('admin-auth-token='.length);
        if (value) {
          const token = decodeURIComponent(value);
          console.log('Found token in cookie:', token.substring(0, 20) + '...');
          setAdminToken(token);
          setUserIsAdmin(true);
          return;
        }
      }
    }
    
    console.log('No admin token found');
    setUserIsAdmin(false);
    setAdminToken(null);
  };

  const fetchData = async () => {
    try {
      const [commentsRes, kitsRes] = await Promise.all([
        fetch('/api/comments'),
        fetch('/api/kits'),
      ]);

      const commentsData = await commentsRes.json();
      const kitsData = await kitsRes.json();

      setComments(Array.isArray(commentsData) ? commentsData : []);
      setKits(Array.isArray(kitsData) ? kitsData : []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!author.trim() || !content.trim()) {
      toast({
        title: 'Errore',
        description: 'Nome e commento sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author.trim(),
          content: content.trim(),
          userId: userId,
          kitId: selectedKitId || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create comment');
      }

      const newComment = await response.json();
      setComments([newComment, ...comments]);

      // Reset form and close dialog
      setAuthor('');
      setContent('');
      setSelectedKitId('');
      setShowKitSelect(false);
      setKitSearch('');
      setDialogOpen(false);

      toast({
        title: 'Successo',
        description: 'Commento pubblicato con successo!',
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile pubblicare il commento',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReplySubmit = async (parentId: string) => {
    if (!replyAuthor.trim() || !replyContent.trim()) {
      toast({
        title: 'Errore',
        description: 'Nome e risposta sono obbligatori',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingReply(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: replyAuthor.trim(),
          content: replyContent.trim(),
          userId: userId,
          parentId: parentId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create reply');

      const newReply = await response.json();

      // Aggiorna il commento padre con la nuova risposta
      setComments(comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            Replies: [...(comment.Replies || []), newReply]
          };
        }
        return comment;
      }));

      setReplyingTo(null);
      setReplyContent('');
      setReplyAuthor('');

      toast({
        title: 'Successo',
        description: 'Risposta pubblicata con successo!',
      });
    } catch (error) {
      console.error('Error creating reply:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile pubblicare la risposta',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      toast({
        title: 'Errore',
        description: 'Il commento non può essere vuoto',
        variant: 'destructive',
      });
      return;
    }

    setSubmittingEdit(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: commentId,
          content: editContent.trim(),
          userId: userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }

      const updatedComment = await response.json();

      // Aggiorna il commento nella lista
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, content: updatedComment.content, updatedAt: updatedComment.updatedAt };
        }
        // Aggiorna anche nelle risposte
        if (comment.Replies) {
          return {
            ...comment,
            Replies: comment.Replies.map(reply => 
              reply.id === commentId 
                ? { ...reply, content: updatedComment.content, updatedAt: updatedComment.updatedAt }
                : reply
            )
          };
        }
        return comment;
      }));

      setEditingComment(null);
      setEditContent('');

      toast({
        title: 'Successo',
        description: 'Commento modificato con successo!',
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile modificare il commento',
        variant: 'destructive',
      });
    } finally {
      setSubmittingEdit(false);
    }
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete || !adminToken) {
      console.log('Cannot delete: commentToDelete=', commentToDelete, 'adminToken=', adminToken ? 'present' : 'missing');
      return;
    }

    console.log('Deleting comment with token:', adminToken.substring(0, 20) + '...');
    setDeleting(true);
    try {
      const response = await fetch(`/api/comments?id=${commentToDelete}&adminToken=${encodeURIComponent(adminToken)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }

      // Rimuovi il commento dalla lista
      setComments(comments.filter(comment => {
        if (comment.id === commentToDelete) return false;
        // Rimuovi anche dalle risposte
        if (comment.Replies) {
          comment.Replies = comment.Replies.filter(reply => reply.id !== commentToDelete);
        }
        return true;
      }));

      setDeleteDialogOpen(false);
      setCommentToDelete(null);

      toast({
        title: 'Successo',
        description: 'Commento cancellato con successo!',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile cancellare il commento',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const openDeleteDialog = (commentId: string) => {
    setCommentToDelete(commentId);
    setDeleteDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredKits = kits.filter(kit =>
    `${kit.name} ${kit.team} ${kit.type}`.toLowerCase().includes(kitSearch.toLowerCase())
  );

  const getKitTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      home: 'Casa',
      away: 'Trasferta',
      third: 'Terza',
      goalkeeper: 'Portiere',
    };
    return labels[type] || type;
  };

  const getKitTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      home: 'bg-blue-500 text-white',
      away: 'bg-white text-black border',
      third: 'bg-purple-500 text-white',
      goalkeeper: 'bg-green-500 text-white',
    };
    return colors[type] || '';
  };

  const totalComments = comments.reduce((acc, c) => acc + 1 + (c.Replies?.length || 0), 0);

  const isCommentEdited = (createdAt: string, updatedAt: string) => {
    return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
  };

  const renderCommentActions = (comment: Comment | Reply, isReply: boolean = false) => {
    const canEdit = comment.userId === userId; // L'utente può modificare i propri commenti e risposte
    const canDelete = userIsAdmin;

    return (
      <div className="flex items-center gap-2 mt-2">
        {/* Rispondi (solo per commenti principali) */}
        {!isReply && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setReplyingTo(replyingTo === comment.id ? null : comment.id);
              setReplyContent('');
              setReplyAuthor('');
            }}
          >
            <Reply className="w-3 h-3 mr-1" />
            Rispondi
          </Button>
        )}

        {/* Modifica (solo propri commenti) */}
        {canEdit && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setEditingComment(comment.id);
              setEditContent(comment.content);
            }}
          >
            <Pencil className="w-3 h-3 mr-1" />
            Modifica
          </Button>
        )}

        {/* Cancella (solo admin) */}
        {canDelete && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => openDeleteDialog(comment.id)}
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Cancella
          </Button>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Dialog per nuovo commento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nuovo Commento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="author">Nome *</Label>
              <Input
                id="author"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Il tuo nome"
                maxLength={50}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Kit associato (opzionale)</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant={showKitSelect ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    setShowKitSelect(!showKitSelect);
                    if (showKitSelect) {
                      setSelectedKitId('');
                      setKitSearch('');
                    }
                  }}
                >
                  {showKitSelect ? 'Rimuovi kit' : 'Seleziona kit'}
                </Button>
                {selectedKitId && (
                  <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md text-sm">
                    {kits.find(k => k.id === selectedKitId)?.name} - {kits.find(k => k.id === selectedKitId)?.team}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4"
                      onClick={() => {
                        setSelectedKitId('');
                        setShowKitSelect(false);
                        setKitSearch('');
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {showKitSelect && (
              <div className="space-y-2 p-3 border rounded-lg bg-muted/30">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Cerca kit..."
                    value={kitSearch}
                    onChange={(e) => setKitSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <ScrollArea className="h-40">
                  <div className="space-y-1">
                    {filteredKits.map((kit) => (
                      <div
                        key={kit.id}
                        onClick={() => {
                          setSelectedKitId(kit.id);
                          setShowKitSelect(false);
                          setKitSearch('');
                        }}
                        className={`p-2 rounded-md cursor-pointer flex items-center justify-between transition-colors ${
                          selectedKitId === kit.id
                            ? 'bg-primary text-primary-foreground'
                            : 'hover:bg-muted'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{kit.name}</span>
                          <span className="text-muted-foreground">- {kit.team}</span>
                        </div>
                        <Badge className={getKitTypeColor(kit.type)}>
                          {getKitTypeLabel(kit.type)}
                        </Badge>
                      </div>
                    ))}
                    {filteredKits.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        Nessun kit trovato
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="content">Commento *</Label>
              <Textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Scrivi il tuo commento..."
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/500
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
              >
                Annulla
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Pubblica
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma cancellazione */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Conferma cancellazione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler cancellare questo commento? Questa azione non può essere annullata.
              {commentToDelete && comments.find(c => c.id === commentToDelete)?.Replies && 
                comments.find(c => c.id === commentToDelete)?.Replies!.length > 0 && (
                <span className="block mt-2 text-red-500 font-medium">
                  Verranno cancellate anche tutte le risposte a questo commento.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteComment}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cancellazione...
                </>
              ) : (
                'Cancella commento'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lista commenti */}
      <Card className="backdrop-blur-sm card-custom-color border-2 transition-custom-color">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5" />
              Tutti i commenti ({totalComments})
            </CardTitle>
            <Button onClick={() => setDialogOpen(true)} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Lascia un commento
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nessun commento ancora</p>
              <p className="text-sm">Sii il primo a commentare!</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 rounded-lg border bg-muted/30"
                  >
                    {/* Edit Mode */}
                    {editingComment === comment.id ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          maxLength={500}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleEditComment(comment.id)}
                            disabled={submittingEdit}
                          >
                            {submittingEdit ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3 mr-1" />
                            )}
                            Salva
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingComment(null);
                              setEditContent('');
                            }}
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold">{comment.author}</span>
                            {comment.Kit && (
                              <Badge variant="outline" className="text-xs">
                                {comment.Kit.name} - {comment.Kit.team}
                              </Badge>
                            )}
                            {isCommentEdited(comment.createdAt, comment.updatedAt) && (
                              <span className="text-xs text-muted-foreground italic">(modificato)</span>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                        
                        {/* Action buttons */}
                        {renderCommentActions(comment)}
                      </>
                    )}

                    {/* Form Risposta */}
                    {replyingTo === comment.id && (
                      <div className="mt-3 p-3 border rounded-lg bg-muted/20 space-y-2">
                        <Input
                          placeholder="Il tuo nome"
                          value={replyAuthor}
                          onChange={(e) => setReplyAuthor(e.target.value)}
                          maxLength={50}
                        />
                        <Textarea
                          placeholder="Scrivi la tua risposta..."
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          rows={2}
                          maxLength={300}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleReplySubmit(comment.id)}
                            disabled={submittingReply}
                          >
                            {submittingReply ? (
                              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            ) : (
                              <Send className="w-3 h-3 mr-1" />
                            )}
                            Invia risposta
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setReplyingTo(null);
                              setReplyContent('');
                              setReplyAuthor('');
                            }}
                          >
                            Annulla
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Risposte */}
                    {comment.Replies && comment.Replies.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-primary/20 space-y-3">
                        {comment.Replies.map((reply) => (
                          <div key={reply.id} className="py-2">
                            {/* Edit Mode per risposte */}
                            {editingComment === reply.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  rows={2}
                                  maxLength={500}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleEditComment(reply.id)}
                                    disabled={submittingEdit}
                                  >
                                    {submittingEdit ? (
                                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                    ) : (
                                      <Send className="w-3 h-3 mr-1" />
                                    )}
                                    Salva
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setEditingComment(null);
                                      setEditContent('');
                                    }}
                                  >
                                    Annulla
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-start justify-between gap-2 mb-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium text-sm">{reply.author}</span>
                                    <Badge variant="secondary" className="text-xs">Risposta</Badge>
                                    {isCommentEdited(reply.createdAt, reply.updatedAt) && (
                                      <span className="text-xs text-muted-foreground italic">(modificato)</span>
                                    )}
                                  </div>
                                  <span className="text-xs text-muted-foreground">
                                    {formatDate(reply.createdAt)}
                                  </span>
                                </div>
                                <p className="text-sm whitespace-pre-wrap">{reply.content}</p>

                                {/* Action buttons per risposte */}
                                {renderCommentActions(reply, true)}
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </>
  );
}
