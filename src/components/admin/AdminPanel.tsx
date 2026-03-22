'use client';

import { useState, useEffect, Suspense } from 'react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { User as UserIcon, Shirt, Link2, Globe, BarChart3, MessageCircle, Loader2, Pencil, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player, Kit, PlayerKit, Nation, AdminPanelProps } from './types';
import PlayersTab from './PlayersTab';
import KitsTab from './KitsTab';
import AssociationsTab from './AssociationsTab';
import NationsTab from './NationsTab';
import StatsTab from './StatsTab';
import CommentsTab from './CommentsTab';

interface ExtendedAdminPanelProps extends AdminPanelProps {
  adminToken: string;
}

function AdminPanelContent({ onClose, onUpdate, adminToken }: ExtendedAdminPanelProps) {
  const { toast } = useToast();
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [playerKits, setPlayerKits] = useState<PlayerKit[]>([]);
  const [nations, setNations] = useState<Nation[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Nickname state
  const [nickname, setNickname] = useState<string>('');
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNickname, setEditNickname] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);

  useEffect(() => {
    fetchData();
    fetchNickname();
  }, []);

  const fetchNickname = async () => {
    try {
      const response = await fetch('/api/admin/nickname');
      const data = await response.json();
      setNickname(data.nickname || '');
    } catch (error) {
      console.error('Error fetching nickname:', error);
    }
  };

  const handleSaveNickname = async () => {
    if (!adminToken) {
      toast({
        title: 'Errore',
        description: 'Token di autenticazione non trovato. Prova a rifare il login.',
        variant: 'destructive',
      });
      return;
    }
    
    setSavingNickname(true);
    try {
      const response = await fetch('/api/admin/nickname', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nickname: editNickname.trim() || null,
          adminToken: adminToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Se la sessione è scaduta, mostra messaggio specifico
        if (response.status === 401) {
          toast({
            title: 'Sessione scaduta',
            description: error.details || 'Effettua nuovamente il login.',
            variant: 'destructive',
          });
          setSavingNickname(false);
          return;
        }
        
        throw new Error(error.details || error.error || 'Failed to update nickname');
      }

      setNickname(editNickname.trim());
      setIsEditingNickname(false);
      
      toast({
        title: 'Successo',
        description: 'Nickname aggiornato con successo',
      });
    } catch (error) {
      console.error('Error saving nickname:', error);
      toast({
        title: 'Errore',
        description: error instanceof Error ? error.message : 'Impossibile aggiornare il nickname',
        variant: 'destructive',
      });
    } finally {
      setSavingNickname(false);
    }
  };

  const handleStartEditNickname = () => {
    setEditNickname(nickname);
    setIsEditingNickname(true);
  };

  const handleCancelEditNickname = () => {
    setEditNickname('');
    setIsEditingNickname(false);
  };

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

      setPlayers(Array.isArray(playersData) ? playersData : []);
      setKits(Array.isArray(kitsData) ? kitsData : []);
      setPlayerKits(Array.isArray(playerKitsData) ? playerKitsData : []);
      setNations(Array.isArray(nationsData) ? nationsData : []);
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

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Create kit error:', errorData);
        throw new Error(errorData.error || errorData.details || 'Failed to create kit');
      }

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
      const response = await fetch(`/api/kit/${kitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Update kit error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to update kit');
      }

      const updatedKit = await response.json();
      setKits(kits.map((k) => (k.id === kitId ? updatedKit : k)));

      // Aggiorna anche le associazioni che contengono questo kit
      if (Array.isArray(playerKits)) {
        setPlayerKits(playerKits.map((pk) =>
          pk.kitId === kitId ? { ...pk, Kit: updatedKit } : pk
        ));
      }

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
      await fetch(`/api/kit/${kitId}`, { method: 'DELETE' });
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
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-2xl">Pannello di Amministrazione</CardTitle>
              <CardDescription>
                Gestisci giocatori, kit e le loro associazioni
              </CardDescription>
            </div>
            
            {/* Nickname Section */}
            <div className="flex-shrink-0">
              <div className="text-sm text-muted-foreground mb-1">Nickname</div>
              {isEditingNickname ? (
                <div className="flex items-center gap-1">
                  <Input
                    value={editNickname}
                    onChange={(e) => setEditNickname(e.target.value)}
                    className="h-8 w-36 text-sm"
                    placeholder="Il tuo nickname"
                    maxLength={50}
                    disabled={savingNickname}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleSaveNickname}
                    disabled={savingNickname || !editNickname.trim()}
                  >
                    {savingNickname ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4 text-emerald-600" />
                    )}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handleCancelEditNickname}
                    disabled={savingNickname}
                  >
                    <X className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <span className={`text-sm font-medium ${!nickname && 'text-muted-foreground italic'}`}>
                    {nickname || 'Non impostato'}
                  </span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7"
                    onClick={handleStartEditNickname}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="stats" className="w-full">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6 gap-1 sm:gap-2 h-auto">
              <TabsTrigger value="stats" className="flex items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 h-12 sm:h-auto min-w-[80px] sm:min-w-0">
                <BarChart3 className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Statistiche</span>
              </TabsTrigger>
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
              <TabsTrigger value="comments" className="flex items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 h-12 sm:h-auto min-w-[80px] sm:min-w-0">
                <MessageCircle className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                <span>Commenti</span>
              </TabsTrigger>
              {nations.length === 0 && (
                <TabsTrigger value="nations" className="flex items-center justify-center gap-2 sm:gap-2 text-sm sm:text-base py-2.5 sm:py-3 h-12 sm:h-auto min-w-[80px] sm:min-w-0">
                  <Globe className="w-4 h-4 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span>Nazionalità</span>
                </TabsTrigger>
              )}
            </TabsList>

            {/* Stats Tab */}
            <TabsContent value="stats" className="mt-4">
              <StatsTab />
            </TabsContent>

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

            {/* Comments Tab */}
            <TabsContent value="comments" className="mt-0">
              <CommentsTab adminToken={adminToken} adminNickname={nickname} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminPanel(props: AdminPanelProps) {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto">
        <Card>
          <CardContent className="flex items-center justify-center h-96">
            <div className="text-center">
              <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-emerald-500" />
              <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    }>
      <AdminPanelContent {...props} />
    </Suspense>
  );
}
