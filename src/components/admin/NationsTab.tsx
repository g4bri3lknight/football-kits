'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Globe, Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function NationsTab() {
  const { toast } = useToast();
  const [nationsCount, setNationsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchNationsCount();
  }, []);

  const fetchNationsCount = async () => {
    try {
      const response = await fetch('/api/nations');
      if (!response.ok) throw new Error('Failed to fetch nations');
      const nations = await response.json();
      setNationsCount(nations.length);
    } catch (error) {
      console.error('Error fetching nations:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare le nazionalità',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePopulate = async () => {
    setPopulating(true);
    try {
      const response = await fetch('/api/nations', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: 'Info',
            description: 'Le nazionalità sono già state popolate',
            variant: 'default',
          });
        } else {
          throw new Error(errorData.error || 'Failed to populate nations');
        }
        return;
      }

      const data = await response.json();
      toast({
        title: 'Successo',
        description: `Inserite ${data.count} nazionalità con successo`,
      });
      setNationsCount(data.count);
    } catch (error) {
      console.error('Error populating nations:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile popolare le nazionalità',
        variant: 'destructive',
      });
    } finally {
      setPopulating(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!confirm('Sei sicuro di voler eliminare tutte le nazionalità?')) {
      return;
    }

    setDeleting(true);
    try {
      const response = await fetch('/api/nations', {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete nations');

      toast({
        title: 'Successo',
        description: 'Tutte le nazionalità sono state eliminate',
      });
      setNationsCount(0);
    } catch (error) {
      console.error('Error deleting nations:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare le nazionalità',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Gestione Nazionalità
        </CardTitle>
        <CardDescription>
          Popola o resetta il database delle nazionalità dei giocatori
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {nationsCount === 0 ? (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <Globe className="w-16 h-16 text-gray-400" />
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Nessuna nazionalità presente nel database
            </p>
            <Button
              onClick={handlePopulate}
              disabled={populating}
              size="lg"
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {populating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Popolamento in corso...
                </>
              ) : (
                <>
                  <Globe className="w-4 h-4 mr-2" />
                  Popola Nazionalità
                </>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
                    Nazionalità presenti nel database
                  </p>
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {nationsCount}
                  </p>
                </div>
                <div className="text-4xl">🌍</div>
              </div>
            </div>

            <Button
              onClick={handleDeleteAll}
              disabled={deleting}
              variant="destructive"
              className="w-full"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Eliminazione in corso...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Elimina Tutte le Nazionalità
                </>
              )}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Attenzione: questa azione eliminerà tutte le nazionalità dal database
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
