'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { User as UserIcon, Shirt, Link2, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player, Kit, PlayerKit, Nation, AdminPanelProps } from './types';
import PlayersTab from './PlayersTab';
import KitsTab from './KitsTab';
import AssociationsTab from './AssociationsTab';
import NationsTab from './NationsTab';

export default function AdminPanel({ onClose, onUpdate }: AdminPanelProps) {
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [playerKits, setPlayerKits] = useState<PlayerKit[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [playersRes, kitsRes, playerKitsRes, nationsRes] = await Promise.all([
        fetch('/api/players'),
        fetch('/api/kits'),
        fetch('/api/player-kits'),
        fetch('/api/nations'),
      ]);

      const [playersData, kitsData, playerKitsData, nationsData] = await Promise.all([
        playersRes.json(),
        kitsRes.json(),
        playerKitsRes.json(),
        nationsRes.json(),
      ]);

      setPlayers(playersData);
      setKits(kitsData);
      setPlayerKits(playerKitsData);
      setNations(nationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare i dati',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File, folder: string = 'uploads'): Promise<string> => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile caricare il file',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  // Player CRUD operations
  const handleCreatePlayer = async (playerData: any) => {
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: 'Giocatore duplicato',
            description: errorData.error || 'Esiste già un giocatore con questi dati',
            variant: 'destructive',
          });
          throw new Error(errorData.error);
        }
        throw new Error(errorData.error || 'Failed to create player');
      }

      const newPlayer = await response.json();
      setPlayers([...players, newPlayer]);

      toast({
        title: 'Successo',
        description: 'Giocatore creato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error creating player:', error);
      throw error;
    }
  };

  const handleUpdatePlayer = async (playerId: string, playerData: any) => {
    try {
      const response = await fetch(`/api/players/${playerId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playerData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 409) {
          toast({
            title: 'Giocatore duplicato',
            description: errorData.error || 'Esiste già un giocatore con questi dati',
            variant: 'destructive',
          });
          throw new Error(errorData.error);
        }
        throw new Error(errorData.error || 'Failed to update player');
      }

      const updatedPlayer = await response.json();
      setPlayers(players.map((p) => (p.id === playerId ? updatedPlayer : p)));

      // Update players inside playerKits to reflect changes
      if (Array.isArray(playerKits)) {
        setPlayerKits(
          playerKits.map((pk) =>
            pk.playerId === playerId
              ? { ...pk, Player: updatedPlayer }
              : pk
          )
        );
      }

      toast({
        title: 'Successo',
        description: 'Giocatore aggiornato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating player:', error);
      throw error;
    }
  };

  const handleDeletePlayer = async (playerId: string) => {
    try {
      await fetch(`/api/players/${playerId}`, { method: 'DELETE' });
      setPlayers(players.filter((p) => p.id !== playerId));

      toast({
        title: 'Successo',
        description: 'Giocatore eliminato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il giocatore',
        variant: 'destructive',
      });
    }
  };

  // Kit CRUD operations
  const handleCreateKit = async (kitData: any) => {
    try {
      const response = await fetch('/api/kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitData),
      });

      if (!response.ok) throw new Error('Failed to create kit');

      const newKit = await response.json();
      setKits([...kits, newKit]);

      toast({
        title: 'Successo',
        description: 'Kit creato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error creating kit:', error);
      throw error;
    }
  };

  const handleUpdateKit = async (kitId: string, kitData: any) => {
    try {
      const response = await fetch(`/api/kits/${kitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitData),
      });

      if (!response.ok) throw new Error('Failed to update kit');

      const updatedKit = await response.json();
      setKits(kits.map((k) => (k.id === kitId ? updatedKit : k)));

      // Aggiorna anche le associazioni che contengono questo kit
      setPlayerKits(playerKits.map((pk) =>
        pk.kitId === kitId ? { ...pk, Kit: updatedKit } : pk
      ));

      toast({
        title: 'Successo',
        description: 'Kit aggiornato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating kit:', error);
      throw error;
    }
  };

  const handleDeleteKit = async (kitId: string) => {
    try {
      await fetch(`/api/kits/${kitId}`, { method: 'DELETE' });
      setKits(kits.filter((k) => k.id !== kitId));

      toast({
        title: 'Successo',
        description: 'Kit eliminato con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting kit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare il kit',
        variant: 'destructive',
      });
    }
  };

  // PlayerKit operations
  const handleCreatePlayerKit = async (data: { playerId: string; kitId: string }) => {
    try {
      const response = await fetch('/api/player-kits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create player kit');
      }

      const newPlayerKit = await response.json();
      setPlayerKits([...playerKits, newPlayerKit]);

      toast({
        title: 'Successo',
        description: 'Associazione creata con successo',
      });
      onUpdate?.();
    } catch (error: any) {
      console.error('Error creating player kit:', error);
      toast({
        title: 'Errore',
        description: error.message || 'Impossibile creare l\'associazione',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleDeletePlayerKit = async (id: string) => {
    try {
      await fetch(`/api/player-kits/${id}`, { method: 'DELETE' });
      setPlayerKits(playerKits.filter((pk) => pk.id !== id));

      toast({
        title: 'Successo',
        description: 'Associazione eliminata con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting player kit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile eliminare l\'associazione',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePlayerKit = async (id: string, data: { playerId: string; kitId: string }) => {
    try {
      const response = await fetch(`/api/player-kits/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update player kit');
      }

      const updatedPlayerKit = await response.json();
      setPlayerKits(playerKits.map((pk) => (pk.id === id ? updatedPlayerKit : pk)));

      toast({
        title: 'Successo',
        description: 'Associazione aggiornata con successo',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error updating player kit:', error);
      toast({
        title: 'Errore',
        description: 'Impossibile aggiornare l\'associazione',
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Pannello di Amministrazione</CardTitle>
          <CardDescription>
            Gestisci giocatori, kit e le loro associazioni
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="players" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2 h-auto">
              <TabsTrigger value="players" className="flex items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 h-12 sm:h-auto min-w-[80px] sm:min-w-0">
                <UserIcon className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Giocatori</span>
              </TabsTrigger>
              <TabsTrigger value="kits" className="flex items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 h-12 sm:h-auto min-w-[80px] sm:min-w-0">
                <Shirt className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Kit</span>
              </TabsTrigger>
              <TabsTrigger value="associations" className="flex items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 h-12 sm:h-auto min-w-[80px] sm:min-w-0">
                <Link2 className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Associazioni</span>
              </TabsTrigger>
              {nations.length === 0 && (
                <TabsTrigger value="nations" className="flex items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 h-12 sm:h-auto min-w-[80px] sm:min-w-0">
                  <Globe className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Nazionalità</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Players Tab */}
            <TabsContent value="players" className="mt-0">
              <PlayersTab
                players={players}
                nations={nations}
                uploading={uploading}
                onUpload={handleFileUpload}
                onCreatePlayer={handleCreatePlayer}
                onUpdatePlayer={handleUpdatePlayer}
                onDeletePlayer={handleDeletePlayer}
              />
            </TabsContent>

            {/* Kits Tab */}
            <TabsContent value="kits" className="mt-0">
              <KitsTab
                kits={kits}
                uploading={uploading}
                onUpload={handleFileUpload}
                onCreateKit={handleCreateKit}
                onUpdateKit={handleUpdateKit}
                onDeleteKit={handleDeleteKit}
              />
            </TabsContent>

            {/* Associations Tab */}
            <TabsContent value="associations" className="mt-0">
              <AssociationsTab
                players={players}
                kits={kits}
                playerKits={playerKits}
                onCreatePlayerKit={handleCreatePlayerKit}
                onUpdatePlayerKit={handleUpdatePlayerKit}
                onDeletePlayerKit={handleDeletePlayerKit}
              />
            </TabsContent>

            {/* Nations Tab - only visible when no nations exist */}
            {nations.length === 0 && (
              <TabsContent value="nations" className="mt-0">
                <NationsTab />
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
