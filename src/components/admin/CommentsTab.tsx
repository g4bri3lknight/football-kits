'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Pencil, Trash2, Search, Loader2, MessageCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Comment } from './types';
import { translateKitType, getKitTypeColor } from './utils';

interface CommentsTabProps {
  adminToken: string;
}

interface FlattenedComment extends Comment {
  isReply: boolean;
  parentAuthor?: string;
}

export default function CommentsTab({ adminToken }: CommentsTabProps) {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingComment, setEditingComment] = useState<Comment | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<Comment | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/comments');
      const data = await response.json();
      setComments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i commenti',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDialog = (comment: Comment) => {
    setEditingComment(comment);
    setEditContent(comment.content);
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditingComment(null);
    setEditContent('');
    setEditDialogOpen(false);
  };

  const handleEditComment = async () => {
    if (!editingComment || !editContent.trim()) {
      toast({
        title: 'Errore',
        description: 'Il contenuto non può essere vuoto',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingComment.id,
          content: editContent.trim(),
          adminToken: adminToken,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update comment');
      }

      const updatedComment = await response.json();
      
      setComments(comments.map(comment => {
        if (comment.id === editingComment.id) {
          return { ...comment, content: updatedComment.content, updatedAt: updatedComment.updatedAt };
        }
        // Aggiorna anche nelle risposte
        if (comment.Replies) {
          return {
            ...comment,
            Replies: comment.Replies.map(reply =>
              reply.id === editingComment.id
                ? { ...reply, content: updatedComment.content, updatedAt: updatedComment.updatedAt }
                : reply
            )
          };
        }
        return comment;
      }));

      handleCloseEditDialog();
      
      toast({
        title: 'Successo',
        description: 'Commento modificato con successo',
      });
    } catch (error) {
      console.error('Error updating comment:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile modificare il commento',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenDeleteDialog = (comment: Comment) => {
    setCommentToDelete(comment);
    setDeleteDialogOpen(true);
  };

  const handleDeleteComment = async () => {
    if (!commentToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/comments?id=${commentToDelete.id}&adminToken=${encodeURIComponent(adminToken)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete comment');
      }

      // Rimuovi il commento dalla lista
      setComments(comments.filter(comment => {
        if (comment.id === commentToDelete.id) return false;
        // Rimuovi anche dalle risposte
        if (comment.Replies) {
          comment.Replies = comment.Replies.filter(reply => reply.id !== commentToDelete.id);
        }
        return true;
      }));

      setDeleteDialogOpen(false);
      setCommentToDelete(null);

      toast({
        title: 'Successo',
        description: 'Commento eliminato con successo',
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

  const isCommentEdited = (createdAt: string, updatedAt: string) => {
    return new Date(updatedAt).getTime() - new Date(createdAt).getTime() > 1000;
  };

  // Flatten comments with replies for display
  const flattenedComments: FlattenedComment[] = comments.flatMap(comment => {
    const items: FlattenedComment[] = [{ ...comment, isReply: false }];
    if (comment.Replies && comment.Replies.length > 0) {
      comment.Replies.forEach(reply => {
        items.push({ 
          ...reply, 
          isReply: true, 
          parentAuthor: comment.author,
          Kit: comment.Kit // Eredita il kit dal commento padre
        });
      });
    }
    return items;
  });

  const filteredComments = flattenedComments.filter((comment): comment is FlattenedComment => {
    const searchLower = search.toLowerCase();
    return (
      comment.author.toLowerCase().includes(searchLower) ||
      comment.content.toLowerCase().includes(searchLower) ||
      (comment.Kit?.team?.toLowerCase() || '').includes(searchLower) ||
      (comment.Kit?.name?.toLowerCase() || '').includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto space-y-2">
            <h3 className="text-lg font-semibold">Gestione Commenti</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Cerca per autore, contenuto, kit..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageCircle className="w-4 h-4" />
            <span>{filteredComments.length} commenti</span>
          </div>
        </div>

        {/* Comments Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[140px]">Kit</TableHead>
                    <TableHead className="w-[100px]">Autore</TableHead>
                    <TableHead>Contenuto</TableHead>
                    <TableHead className="w-[140px]">Data</TableHead>
                    <TableHead className="w-[80px] text-right">Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-8">
                        {search ? 'Nessun risultato trovato' : 'Nessun commento presente'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredComments.map((comment) => (
                      <TableRow key={comment.id} className={comment.isReply ? 'bg-muted/30' : ''}>
                        <TableCell>
                          {comment.Kit ? (
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{comment.Kit.team}</div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">{comment.Kit.name}</span>
                                <Badge className={getKitTypeColor(comment.Kit.type)} variant="outline">
                                  {translateKitType(comment.Kit.type)}
                                </Badge>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {comment.isReply && (
                              <Badge variant="secondary" className="text-[10px] h-4">Risposta</Badge>
                            )}
                            <span className="font-medium text-sm">{comment.author}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px]">
                            <p className="text-sm truncate" title={comment.content}>
                              {comment.content}
                            </p>
                            {isCommentEdited(comment.createdAt, comment.updatedAt) && (
                              <span className="text-[10px] text-muted-foreground italic">(modificato)</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(comment.createdAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenEditDialog(comment)}
                              className="h-8 w-8"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDeleteDialog(comment)}
                              className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={handleCloseEditDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifica Commento</DialogTitle>
            <DialogDescription>
              Modifica il contenuto del commento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {editingComment?.Kit && (
              <div className="p-3 bg-muted rounded-lg">
                <div className="text-sm font-medium">{editingComment.Kit.team}</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">{editingComment.Kit.name}</span>
                  <Badge className={getKitTypeColor(editingComment.Kit.type)} variant="outline">
                    {translateKitType(editingComment.Kit.type)}
                  </Badge>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-medium">Autore</label>
              <Input value={editingComment?.author || ''} disabled />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Contenuto</label>
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground text-right">
                {editContent.length}/500
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseEditDialog} disabled={saving}>
              Annulla
            </Button>
            <Button onClick={handleEditComment} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                'Salva'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina Commento</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare questo commento?
              {commentToDelete?.Replies && commentToDelete.Replies.length > 0 && (
                <span className="block mt-2 text-amber-600 font-medium">
                  Verranno eliminate anche {commentToDelete.Replies.length} risposte.
                </span>
              )}
              <span className="block mt-2">Questa azione non può essere annullata.</span>
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
                  Eliminazione...
                </>
              ) : (
                'Elimina'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
