'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import { Eye, TrendingUp, Calendar, Globe, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PageViewStats {
  totalViews: number;
  viewsByPage: { page: string; count: number }[];
  dailyStats: { date: string; count: number }[];
}

export default function VisiteStats() {
  const [stats, setStats] = useState<PageViewStats | null>(null);
  const [period, setPeriod] = useState('all');
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchStats();
  }, [period]);

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

  return (
    <div className="h-full w-full flex flex-col gap-3 overflow-y-auto">
      {/* Header with actions */}
      <div className="shrink-0 space-y-2">
        {/* Period Filter */}
        <Tabs value={period} onValueChange={setPeriod}>
          <TabsList className="w-full grid grid-cols-4 h-9">
            <TabsTrigger value="all" className="text-xs">Tutti</TabsTrigger>
            <TabsTrigger value="month" className="text-xs">30gg</TabsTrigger>
            <TabsTrigger value="week" className="text-xs">7gg</TabsTrigger>
            <TabsTrigger value="today" className="text-xs">Oggi</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStats}
            disabled={loading}
            className="flex-1 h-8 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Aggiorna
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                size="sm"
                disabled={resetting || (stats?.totalViews === 0)}
                className="flex-1 h-8 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
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
    </div>
  );
}
