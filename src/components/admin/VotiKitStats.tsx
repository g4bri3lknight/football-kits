'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThumbsUp, ThumbsDown, Shirt, Trophy, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/image-url';

interface KitVoteStats {
  topLiked: { id: string; name: string; team: string; type: string; likes: number; dislikes: number; imageUrl?: string; logoUrl?: string }[];
  topDisliked: { id: string; name: string; team: string; type: string; likes: number; dislikes: number; imageUrl?: string; logoUrl?: string }[];
  mostVoted: { id: string; name: string; team: string; type: string; likes: number; dislikes: number; imageUrl?: string; logoUrl?: string }[];
  summary: {
    totalKits: number;
    totalLikes: number;
    totalDislikes: number;
  };
}

export default function VotiKitStats() {
  const [kitStats, setKitStats] = useState<KitVoteStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchKitStats();
  }, []);

  const fetchKitStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/stats/kits');
      const data = await res.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Ensure summary exists with defaults
      setKitStats({
        topLiked: data.topLiked || [],
        topDisliked: data.topDisliked || [],
        mostVoted: data.mostVoted || [],
        summary: {
          totalKits: data.summary?.totalKits || 0,
          totalLikes: data.summary?.totalLikes || 0,
          totalDislikes: data.summary?.totalDislikes || 0,
        },
      });
    } catch (error) {
      console.error('Error fetching kit stats:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le statistiche kit',
        variant: 'destructive',
      });
      // Set default values on error
      setKitStats({
        topLiked: [],
        topDisliked: [],
        mostVoted: [],
        summary: {
          totalKits: 0,
          totalLikes: 0,
          totalDislikes: 0,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const renderKitCard = (kit: { id: string; name: string; team: string; type: string; likes: number; dislikes: number; imageUrl?: string; logoUrl?: string }) => (
    <div 
      key={kit.id}
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
    >
      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
        {kit.logoUrl ? (
          <img
            src={getImageUrl(kit.logoUrl)}
            alt={kit.name}
            className="w-full h-full object-contain p-1"
          />
        ) : kit.imageUrl ? (
          <img
            src={getImageUrl(kit.imageUrl)}
            alt={kit.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Shirt className="w-5 h-5 text-muted-foreground/50" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{kit.name}</p>
        <p className="text-sm text-muted-foreground truncate">{kit.team} • {kit.type}</p>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1 text-green-600">
          <ThumbsUp className="w-4 h-4" />
          <span className="font-semibold">{kit.likes}</span>
        </div>
        <div className="flex items-center gap-1 text-red-600">
          <ThumbsDown className="w-4 h-4" />
          <span className="font-semibold">{kit.dislikes}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!kitStats) return null;

  return (
    <div className="h-full w-full flex flex-col gap-3 overflow-y-auto">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kit Totali</CardTitle>
            <Shirt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kitStats.summary.totalKits}</div>
            <p className="text-xs text-muted-foreground">kit nel database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Likes Totali</CardTitle>
            <ThumbsUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{kitStats.summary.totalLikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">pollici in su</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dislikes Totali</CardTitle>
            <ThumbsDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{kitStats.summary.totalDislikes.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">pollici in giù</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Top Liked */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              Kit Più Apprezzati
            </CardTitle>
            <CardDescription>Top 5 kit con più likes</CardDescription>
          </CardHeader>
          <CardContent>
            {kitStats.topLiked.length > 0 ? (
              <div className="space-y-3">
                {kitStats.topLiked.map(renderKitCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nessun kit ha ancora ricevuto likes</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Disliked */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              Kit Meno Apprezzati
            </CardTitle>
            <CardDescription>Top 5 kit con più dislikes</CardDescription>
          </CardHeader>
          <CardContent>
            {kitStats.topDisliked.length > 0 ? (
              <div className="space-y-3">
                {kitStats.topDisliked.map(renderKitCard)}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Nessun kit ha ancora ricevuto dislikes</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Most Voted */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-600" />
            Kit Più Votati
          </CardTitle>
          <CardDescription>Top 5 kit con più interazioni totali</CardDescription>
        </CardHeader>
        <CardContent>
          {kitStats.mostVoted.length > 0 ? (
            <div className="space-y-3">
              {kitStats.mostVoted.map((kit, index) => (
                <div 
                  key={kit.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="font-bold text-yellow-600">{index + 1}</span>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {kit.logoUrl ? (
                      <img
                        src={getImageUrl(kit.logoUrl)}
                        alt={kit.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : kit.imageUrl ? (
                      <img
                        src={getImageUrl(kit.imageUrl)}
                        alt={kit.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Shirt className="w-5 h-5 text-muted-foreground/50" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{kit.name}</p>
                    <p className="text-sm text-muted-foreground truncate">{kit.team} • {kit.type}</p>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="text-center">
                      <p className="text-lg font-bold">{kit.likes + kit.dislikes}</p>
                      <p className="text-xs text-muted-foreground">voti totali</p>
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-green-600 text-sm">
                        <ThumbsUp className="w-3 h-3" />
                        <span>{kit.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-red-600 text-sm">
                        <ThumbsDown className="w-3 h-3" />
                        <span>{kit.dislikes}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p>Nessun kit ha ancora ricevuto voti</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* No votes message */}
      {kitStats.summary.totalLikes === 0 && kitStats.summary.totalDislikes === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ThumbsUp className="w-16 h-16 text-muted-foreground/30 mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              Nessun voto registrato
            </h3>
            <p className="text-muted-foreground text-center">
              I visitatori possono votare i kit dalla finestra di dettaglio
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
