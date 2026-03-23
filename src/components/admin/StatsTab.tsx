'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Eye, TrendingUp, Calendar, Globe, RefreshCw, Trash2, Loader2, ThumbsUp, ThumbsDown, Shirt, Trophy, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getImageUrl } from '@/lib/image-url';

interface PageViewStats {
  totalViews: number;
  viewsByPage: { page: string; count: number }[];
  dailyStats: { date: string; count: number }[];
}

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

export default function StatsTab() {
  const [activeTab, setActiveTab] = useState('views');
  const [stats, setStats] = useState<PageViewStats | null>(null);
  const [kitStats, setKitStats] = useState<KitVoteStats | null>(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [kitLoading, setKitLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [period]);

  useEffect(() => {
    if (activeTab === 'kits') {
      fetchKitStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/page-views?period=${period}`);
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le statistiche',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchKitStats = async () => {
    setKitLoading(true);
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
      setKitLoading(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const res = await fetch('/api/page-views', {
        method: 'DELETE',
      });
      
      if (!res.ok) throw new Error('Reset failed');
      
      toast({
        title: 'Successo',
        description: 'Tutte le statistiche sono state azzerate',
      });
      
      await fetchStats();
    } catch (error) {
      console.error('Error resetting stats:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile azzerare le statistiche',
        variant: 'destructive',
      });
    } finally {
      setResetting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: 'short' });
  };

  const getPageLabel = (page: string) => {
    switch (page) {
      case 'home': return '🏠 Home Page';
      case 'kit-detail': return '👕 Dettagli Kit';
      case 'player-biography': return '📖 Biografie Giocatori';
      default: return page;
    }
  };

  const getPageIcon = (page: string) => {
    switch (page) {
      case 'home': return <Globe className="w-4 h-4 text-muted-foreground" />;
      case 'kit-detail': return <TrendingUp className="w-4 h-4 text-muted-foreground" />;
      case 'player-biography': return <Calendar className="w-4 h-4 text-muted-foreground" />;
      default: return <Globe className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'all': return 'dall\'inizio';
      case 'month': return 'ultimi 30 giorni';
      case 'week': return 'ultimi 7 giorni';
      case 'today': return 'solo oggi';
      default: return '';
    }
  };

  const maxDailyViews = stats?.dailyStats?.length 
    ? Math.max(...stats.dailyStats.map(d => d.count), 1) 
    : 1;

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

  return (
    <div className="space-y-6">
      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="views">
            <Eye className="w-4 h-4 mr-2" />
            Visite
          </TabsTrigger>
          <TabsTrigger value="kits">
            <Trophy className="w-4 h-4 mr-2" />
            Voti Kit
          </TabsTrigger>
        </TabsList>

        {/* VIEWS TAB */}
        <TabsContent value="views" className="space-y-6 mt-6">
          {/* Header with actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            {/* Period Filter */}
            <Tabs value={period} onValueChange={setPeriod}>
              <TabsList>
                <TabsTrigger value="all">Tutti</TabsTrigger>
                <TabsTrigger value="month">30 giorni</TabsTrigger>
                <TabsTrigger value="week">7 giorni</TabsTrigger>
                <TabsTrigger value="today">Oggi</TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStats}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={resetting || (stats?.totalViews === 0)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Conferma reset statistiche</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sei sicuro di voler azzerare tutte le statistiche? Questa azione cancellerà permanentemente tutti i dati sulle visite.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annulla</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleReset}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {resetting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Reset in corso...
                        </>
                      ) : (
                        'Conferma reset'
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : stats ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Visite Totali</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">{getPeriodLabel()}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Media Giornaliera</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {stats.dailyStats?.length 
                        ? Math.round(stats.totalViews / Math.max(stats.dailyStats.length, 1)).toLocaleString()
                        : '0'}
                    </div>
                    <p className="text-xs text-muted-foreground">visite per giorno</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sezioni Tracciate</CardTitle>
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.viewsByPage?.length || 0}</div>
                    <p className="text-xs text-muted-foreground">sezioni diverse</p>
                  </CardContent>
                </Card>
              </div>

              {/* Views by Page */}
              {stats.viewsByPage && stats.viewsByPage.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visualizzazioni per Sezione</CardTitle>
                    <CardDescription>Distribuzione delle visualizzazioni tra home, kit e biografie</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {stats.viewsByPage.map((item) => (
                        <div key={item.page} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getPageIcon(item.page)}
                            <span className="font-medium">{getPageLabel(item.page)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ 
                                  width: `${(item.count / stats.totalViews) * 100}%` 
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">
                              {item.count.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Daily Stats Chart */}
              {stats.dailyStats && stats.dailyStats.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Visite per Giorno</CardTitle>
                    <CardDescription>Andamento delle visite negli ultimi 30 giorni</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-48 flex items-end gap-1 overflow-x-auto pb-2">
                      {stats.dailyStats.slice(-30).map((item, index) => (
                        <div
                          key={item.date}
                          className="flex-1 min-w-[20px] flex flex-col items-center gap-1"
                          title={`${formatDate(item.date)}: ${item.count} visite`}
                        >
                          <div
                            className="w-full bg-primary/80 hover:bg-primary rounded-t transition-all cursor-pointer"
                            style={{ 
                              height: `${Math.max((item.count / maxDailyViews) * 140, 4)}px`,
                            }}
                          />
                          {index % 5 === 0 && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDate(item.date)}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* No data message */}
              {stats.totalViews === 0 && (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      Nessuna visita registrata
                    </h3>
                    <p className="text-muted-foreground text-center">
                      Le visite inizieranno ad essere tracciate da ora in poi
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : null}
        </TabsContent>

        {/* KITS TAB */}
        <TabsContent value="kits" className="space-y-6 mt-6">
          {kitLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : kitStats ? (
            <div className="space-y-6">
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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
          ) : null}
        </TabsContent>
      </Tabs>
    </div>
  );
}
