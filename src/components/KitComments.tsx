'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
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
import { MessageCircle, Send, Loader2, Reply, Plus, Pencil, Trash2, ThumbsUp, ThumbsDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  author: string;
  content: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  likes: number;
  dislikes: number;
  userVote?: string | null;
  parentId?: string | null;
  Replies?: Comment[];
}

interface KitCommentsProps {
  kitId: string;
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

export function KitComments({ kitId }: KitCommentsProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');

  // Reply state - ora supporta qualsiasi livello
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

  useEffect(() => {
    const id = getUserId();
    setUserId(id);
  }, []);

  useEffect(() => {
    if (kitId && userId) {
      fetchComments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kitId, userId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/comments?kitId=${kitId}&userId=${encodeURIComponent(userId)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments([]);
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
          kitId: kitId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create comment');
      }

      await fetchComments(); // Ricarica tutti i commenti

      setAuthor('');
      setContent('');
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
          kitId: kitId,
        }),
      });

      if (!response.ok) throw new Error('Failed to create reply');

      await fetchComments(); // Ricarica tutti i commenti

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

      await fetchComments(); // Ricarica tutti i commenti

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
    if (!commentToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/comments?id=${commentToDelete}&userId=${encodeURIComponent(userId)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }

      await fetchComments(); // Ricarica tutti i commenti

      setDeleteDialogOpen(false);
      setCommentToDelete(null);

      toast({
        title: 'Successo',
        description: 'Commento eliminato con successo!',
      });
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile eliminare il commento',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleVote = async (commentId: string, voteType: 'like' | 'dislike') => {
    try {
      const response = await fetch(`/api/comments/${commentId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          voteType,
          userId: userId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to vote');
      }

      // Aggiorna il commento nella lista
      setComments(updateCommentInTree(comments, commentId, (c) => {
        const result = JSON.parse(JSON.stringify(c));
        return result;
      }));
      
      // Ricarica per avere i dati aggiornati
      await fetchComments();
    } catch (error) {
      console.error('Error voting for comment:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile registrare il voto',
        variant: 'destructive',
      });
    }
  };

  // Helper per aggiornare un commento nell'albero
  const updateCommentInTree = (
    comments: Comment[],
    commentId: string,
    updater: (c: Comment) => Comment
  ): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return updater(comment);
      }
      if (comment.Replies && comment.Replies.length > 0) {
        return {
          ...comment,
          Replies: updateCommentInTree(comment.Replies, commentId, updater)
        };
      }
      return comment;
    });
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

  // Conta ricorsivamente tutti i commenti
  const countAllComments = (comments: Comment[]): number => {
    return comments.reduce((acc, c) => acc + 1 + (c.Replies ? countAllComments(c.Replies) : 0), 0);
  };

  const totalComments = countAllComments(comments);

  const isCommentEdited = (createdAt: string, updatedAt: string) => {
    return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
  };

  const renderCommentActions = (comment: Comment, depth: number = 0) => {
    const canModify = comment.userId === userId;

    return (
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {/* Like/Dislike buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-xs ${comment.userVote === 'like' ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => handleVote(comment.id, 'like')}
          >
            <ThumbsUp className="w-3 h-3 mr-1" />
            {comment.likes > 0 && <span>{comment.likes}</span>}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={`h-6 px-2 text-xs ${comment.userVote === 'dislike' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'text-muted-foreground hover:text-foreground'}`}
            onClick={() => handleVote(comment.id, 'dislike')}
          >
            <ThumbsDown className="w-3 h-3 mr-1" />
            {comment.dislikes > 0 && <span>{comment.dislikes}</span>}
          </Button>
        </div>

        {/* Pulsante Rispondi - visibile fino al livello 2 (massimo 3 livelli: commento → risposta → risposta) */}
        {depth < 3 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
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

        {canModify && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => {
                setEditingComment(comment.id);
                setEditContent(comment.content);
              }}
            >
              <Pencil className="w-3 h-3 mr-1" />
              Modifica
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={() => {
                setCommentToDelete(comment.id);
                setDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Elimina
            </Button>
          </>
        )}
      </div>
    );
  };

  // Render ricorsivo dei commenti
  const renderComment = (comment: Comment, depth: number = 0) => {
    const isReply = depth > 0;
    const indentClass = isReply ? 'ml-3 pl-3 border-l-2 border-primary/20' : '';
    
    return (
      <div key={comment.id} className={`${indentClass} py-1`}>
        {editingComment === comment.id ? (
          <div className="space-y-2 p-2 rounded bg-muted/30">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={2}
              maxLength={500}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleEditComment(comment.id)} disabled={submittingEdit}>
                {submittingEdit ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                Salva
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setEditingComment(null); setEditContent(''); }}>
                Annulla
              </Button>
            </div>
          </div>
        ) : (
          <div className={`${isReply ? '' : 'p-2 rounded border bg-muted/30'} text-sm`}>
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-xs">{comment.author}</span>
                {isReply && (
                  <Badge variant="secondary" className="text-[10px] h-4">
                    {depth === 1 ? 'Risposta' : 'Risposta'}
                  </Badge>
                )}
                {isCommentEdited(comment.createdAt, comment.updatedAt) && (
                  <span className="text-[10px] text-muted-foreground italic">(modificato)</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDate(comment.createdAt)}
              </span>
            </div>
            <p className="text-xs mt-1 whitespace-pre-wrap">{comment.content}</p>
            {renderCommentActions(comment, depth)}
          </div>
        )}

        {/* Form Risposta */}
        {replyingTo === comment.id && (
          <div className="mt-2 p-2 border rounded bg-muted/20 space-y-2">
            <Input
              placeholder="Il tuo nome"
              value={replyAuthor}
              onChange={(e) => setReplyAuthor(e.target.value)}
              maxLength={50}
              className="text-sm h-8"
            />
            <Textarea
              placeholder="Scrivi la tua risposta..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={2}
              maxLength={300}
              className="text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => handleReplySubmit(comment.id)} disabled={submittingReply}>
                {submittingReply ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                Invia
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setReplyingTo(null); setReplyContent(''); setReplyAuthor(''); }}>
                Annulla
              </Button>
            </div>
          </div>
        )}

        {/* Risposte nidificate */}
        {comment.Replies && comment.Replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.Replies.map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Dialog per nuovo commento */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nuovo Commento</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="comment-author">Nome</Label>
              <Input
                id="comment-author"
                placeholder="Il tuo nome"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="comment-content">Commento</Label>
              <Textarea
                id="comment-content"
                placeholder="Scrivi il tuo commento..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {content.length}/500
              </p>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annulla
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Pubblica
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog conferma eliminazione */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina commento</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo commento? Anche tutte le risposte verranno eliminate. Questa azione non può essere annullata.
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
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Sezione commenti */}
      <div className="mt-3 pt-3 border-t">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MessageCircle className="w-4 h-4" />
            Commenti ({totalComments})
          </div>
          <Button onClick={() => setDialogOpen(true)} size="sm" variant="outline" className="h-7">
            <Plus className="w-3 h-3 sm:mr-1" />
            <span className="hidden sm:inline">Commenta</span>
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-3">
            Nessun commento. Sii il primo a commentare!
          </p>
        ) : (
          <div className="space-y-2">
            {comments.map(comment => renderComment(comment))}
          </div>
        )}
      </div>
    </>
  );
}
