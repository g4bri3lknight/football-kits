'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { MessageCircle, Send, Search, Loader2, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Comment {
  id: string;
  author: string;
  content: string;
  kitId: string | null;
  createdAt: string;
  Kit?: {
    id: string;
    name: string;
    team: string;
    type: string;
  } | null;
}

interface Kit {
  id: string;
  name: string;
  team: string;
  type: string;
}

export default function CommentsPage() {
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [author, setAuthor] = useState('');
  const [content, setContent] = useState('');
  const [selectedKitId, setSelectedKitId] = useState<string>('');
  const [kitSearch, setKitSearch] = useState('');
  const [showKitSelect, setShowKitSelect] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

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
          kitId: selectedKitId || null,
        }),
      });

      if (!response.ok) throw new Error('Failed to create comment');

      const newComment = await response.json();
      setComments([newComment, ...comments]);
      
      setContent('');
      setSelectedKitId('');
      setShowKitSelect(false);
      setKitSearch('');
      
      toast({
        title: 'Successo',
        description: 'Commento pubblicato con successo!',
      });
    } catch (error) {
      console.error('Error creating comment:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile pubblicare il commento',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted py-8 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/">
            <Button variant="outline" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Commenti
          </h1>
        </div>

        <Card className="backdrop-blur-sm card-custom-color border-2 transition-custom-color">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              Nuovo Commento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Pubblica commento
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Separator className="my-6" />

        <Card className="backdrop-blur-sm card-custom-color border-2 transition-custom-color">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MessageCircle className="w-5 h-5" />
              Tutti i commenti ({comments.length})
            </CardTitle>
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
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{comment.author}</span>
                          {comment.Kit && (
                            <Badge variant="outline" className="text-xs">
                              {comment.Kit.name} - {comment.Kit.team}
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
