'use client';
import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
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
import {
  User as UserIcon,
  Shirt,
  Link2,
  Globe,
  Eye,
  ThumbsUp,
  MessageSquare,
  Loader2,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronRight,
  BarChart3,
  Settings,
  ChevronLeft,
  Menu,
  Box,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Player, Kit, PlayerKit, Nation, AdminPanelProps } from './types';
import PlayersTab from './PlayersTab';
import KitsTab from './KitsTab';
import AssociationsTab from './AssociationsTab';
import NationsTab from './NationsTab';
import CommentsTab from './CommentsTab';
import VisiteStats from './VisiteStats';
import VotiKitStats from './VotiKitStats';
import Viewer3DTab, { Viewer3DTabRef } from './Viewer3DTab';
import { cn } from '@/lib/utils';
interface ExtendedAdminPanelProps extends AdminPanelProps {
  adminToken: string;
}
// Menu item types
interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  subItems?: { id: string; label: string; icon: React.ReactNode }[];
}
const menuItems: MenuItem[] = [
  {
    id: 'statistiche',
    label: 'Statistiche',
    icon: <BarChart3 className="w-5 h-5" />,
    subItems: [
      { id: 'visite', label: 'Visite', icon: <Eye className="w-4 h-4" /> },
      { id: 'voti-kit', label: 'Voti Kit', icon: <ThumbsUp className="w-4 h-4" /> },
    ],
  },
  {
    id: 'gestione',
    label: 'Gestione',
    icon: <Settings className="w-5 h-5" />,
    subItems: [
      { id: 'players', label: 'Giocatori', icon: <UserIcon className="w-4 h-4" /> },
      { id: 'kits', label: 'Kit', icon: <Shirt className="w-4 h-4" /> },
      { id: 'associations', label: 'Associazioni', icon: <Link2 className="w-4 h-4" /> },
      { id: 'nations', label: 'Nazionalità', icon: <Globe className="w-4 h-4" /> },
    ],
  },
  {
    id: 'viewer3d',
    label: 'Viewer 3D',
    icon: <Box className="w-5 h-5" />,
  },
  {
    id: 'comments',
    label: 'Commenti',
    icon: <MessageSquare className="w-5 h-5" />,
  },
];
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
  
  // Sidebar state
  const [activeItem, setActiveItem] = useState('visite');
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['statistiche', 'gestione']);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Viewer3D Tab state
  const viewer3DRef = useRef<Viewer3DTabRef>(null);
  const [viewer3DState, setViewer3DState] = useState({
    hasChanges: false,
    hasKitConfig: false,
    selectedKitId: '',
    savingGlobal: false,
  });
  const [showSaveGlobalWarning, setShowSaveGlobalWarning] = useState(false);
  const viewer3DIsSaving = viewer3DState.savingGlobal;

  const handleViewer3DStateChange = useCallback((state: { hasChanges: boolean; saving: boolean; hasKitConfig: boolean; selectedKitId: string; savingGlobal: boolean }) => {
    setViewer3DState(prev => ({ ...prev, hasChanges: state.hasChanges, hasKitConfig: state.hasKitConfig, selectedKitId: state.selectedKitId, savingGlobal: state.savingGlobal }));
  }, []);
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
        let errorData: any;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        console.error('Create kit error:', errorData);
        throw new Error(errorData.error || errorData.details || `Errore HTTP ${response.status}`);
      }
      const newKit = await response.json();
      setKits([...kits, newKit]);
      toast({
        title: 'Successo',
        description: 'Kit creato con successo',
      });
      onUpdate?.();
      // Refresh viewer3D kits se il tab è attivo
      if (activeItem === 'viewer3d') {
        viewer3DRef.current?.handleRefreshKits();
      }
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
      // Refresh viewer3D kits se il tab è attivo (per aggiornare cache buster)
      if (activeItem === 'viewer3d') {
        viewer3DRef.current?.handleRefreshKits();
      }
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
  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };
  const handleMenuClick = (itemId: string) => {
    setActiveItem(itemId);
    setMobileMenuOpen(false); // Chiude il drawer mobile dopo la selezione
  };
  const renderContent = () => {
    switch (activeItem) {
      case 'visite':
        return <VisiteStats />;
      case 'voti-kit':
        return <VotiKitStats />;
      case 'players':
        return (
          <PlayersTab
            players={players}
            nations={nations}
            uploading={uploading}
            onUpload={handleFileUpload}
            onCreatePlayer={handleCreatePlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
          />
        );
      case 'kits':
        return (
          <KitsTab
            kits={kits}
            uploading={uploading}
            onUpload={handleFileUpload}
            onCreateKit={handleCreateKit}
            onUpdateKit={handleUpdateKit}
            onDeleteKit={handleDeleteKit}
          />
        );
      case 'associations':
        return (
          <AssociationsTab
            players={players}
            kits={kits}
            playerKits={playerKits}
            onCreatePlayerKit={handleCreatePlayerKit}
            onUpdatePlayerKit={handleUpdatePlayerKit}
            onDeletePlayerKit={handleDeletePlayerKit}
          />
        );
      case 'nations':
        return <NationsTab />;
      case 'viewer3d':
        return <Viewer3DTab ref={viewer3DRef} adminToken={adminToken} onStateChange={handleViewer3DStateChange} />;
      case 'comments':
        return <CommentsTab adminToken={adminToken} adminNickname={nickname} />;
      default:
        return <VisiteStats />;
    }
  };
  const getPageTitle = () => {
    switch (activeItem) {
      case 'visite': return 'Statistiche Visite';
      case 'voti-kit': return 'Statistiche Voti Kit';
      case 'players': return 'Gestione Giocatori';
      case 'kits': return 'Gestione Kit';
      case 'associations': return 'Gestione Associazioni';
      case 'nations': return 'Gestione Nazionalità';
      case 'viewer3d': return 'Configurazione Viewer 3D';
      case 'comments': return 'Gestione Commenti';
      default: return 'Dashboard';
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    );
  }
  // Renderizza il contenuto del menu sidebar (riutilizzabile)
  const renderSidebarContent = (isMobile: boolean = false) => (
    <>
      {/* Sidebar Header with Nickname */}
      <div className="p-3 border-b border-border">
        {!sidebarCollapsed || isMobile ? (
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground font-medium">Amministratore</div>
            {isEditingNickname ? (
              <div className="flex items-center gap-1">
                <Input
                  value={editNickname}
                  onChange={(e) => setEditNickname(e.target.value)}
                  className="h-7 text-sm flex-1"
                  placeholder="Nickname"
                  maxLength={50}
                  disabled={savingNickname}
                />
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleSaveNickname}
                  disabled={savingNickname || !editNickname.trim()}
                >
                  {savingNickname ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Check className="w-3 h-3 text-emerald-600" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7"
                  onClick={handleCancelEditNickname}
                  disabled={savingNickname}
                >
                  <X className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <span className={`text-sm font-medium flex-1 truncate ${!nickname && 'text-muted-foreground italic'}`}>
                  {nickname || 'Non impostato'}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  onClick={handleStartEditNickname}
                >
                  <Pencil className="w-3 h-3" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-8"
            onClick={() => setSidebarCollapsed(false)}
          >
            <BarChart3 className="w-4 h-4" />
          </Button>
        )}
      </div>
      {/* Sidebar Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-2 space-y-1">
          {menuItems.map((item) => (
            <div key={item.id}>
              {item.subItems ? (
                <>
                  <button
                    onClick={() => {
                      if (sidebarCollapsed && !isMobile) {
                        // When collapsed, navigate to first subItem
                        handleMenuClick(item.subItems![0].id);
                      } else {
                        toggleMenu(item.id);
                      }
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      "hover:bg-muted",
                      (sidebarCollapsed && !isMobile) && "justify-center",
                      !sidebarCollapsed && item.subItems?.some(sub => sub.id === activeItem)
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "",
                      (sidebarCollapsed && !isMobile) && item.subItems?.some(sub => sub.id === activeItem)
                        ? "bg-emerald-500/20 text-emerald-400"
                        : ""
                    )}
                  >
                    {item.icon}
                    {(!sidebarCollapsed || isMobile) && (
                      <>
                        <span className="flex-1 text-left">{item.label}</span>
                        {expandedMenus.includes(item.id) ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </>
                    )}
                  </button>
                  {(!sidebarCollapsed || isMobile) && expandedMenus.includes(item.id) && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          onClick={() => handleMenuClick(subItem.id)}
                          className={cn(
                            "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                            activeItem === subItem.id
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "hover:bg-muted text-muted-foreground"
                          )}
                        >
                          {subItem.icon}
                          <span>{subItem.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleMenuClick(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    activeItem === item.id
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "hover:bg-muted text-muted-foreground",
                    (sidebarCollapsed && !isMobile) && "justify-center"
                  )}
                >
                  {item.icon}
                  {(!sidebarCollapsed || isMobile) && <span>{item.label}</span>}
                </button>
              )}
            </div>
          ))}
        </nav>
      </ScrollArea>
      {/* Collapse Button - Solo per desktop */}
      {!isMobile && (
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </>
  );
  return (
    <div className="relative flex flex-col lg:flex-row h-[calc(100vh-140px)] bg-card rounded-lg shadow-lg border border-border">
      {/* Desktop Sidebar */}
      <aside 
        className={cn(
          "hidden lg:flex bg-muted/50 border-r border-border flex-col transition-all duration-300",
          sidebarCollapsed ? "w-16" : "w-64"
        )}
      >
        {renderSidebarContent(false)}
      </aside>
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 w-full overflow-hidden">
        {/* Content Header with Mobile Menu Button */}
        <header className="px-4 py-3 border-b border-border bg-card">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Mobile Menu Button */}
              <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="lg:hidden h-9 w-9 shrink-0">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-72 p-0">
                  <SheetHeader className="sr-only">
                    <SheetTitle>Menu di navigazione</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col h-full bg-muted/50">
                    {renderSidebarContent(true)}
                  </div>
                </SheetContent>
              </Sheet>
              <h2 className="text-base font-semibold text-foreground truncate">
                {getPageTitle()}
              </h2>
            </div>
            {/* Viewer3D Action Buttons */}
            {activeItem === 'viewer3d' && (
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {viewer3DState.hasChanges && (
                  <span className="text-xs text-amber-500 animate-pulse">
                    Modifiche non salvate
                  </span>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => viewer3DRef.current?.handleReset()}
                  disabled={!viewer3DState.hasChanges || viewer3DIsSaving}
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Annulla
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    if (viewer3DState.hasKitConfig) {
                      setShowSaveGlobalWarning(true);
                    } else {
                      viewer3DRef.current?.handleSave();
                    }
                  }}
                  disabled={viewer3DIsSaving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {viewer3DState.savingGlobal ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4 mr-2" />
                  )}
                  Salva globale
                </Button>
              </div>
            )}
            <AlertDialog open={showSaveGlobalWarning} onOpenChange={setShowSaveGlobalWarning}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Salvare come configurazione globale?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Hai selezionato un kit con configurazione personalizzata. Salvando come globale, questa configurazione diventerà il default per tutti i kit senza config propria.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => {
                      setShowSaveGlobalWarning(false);
                      viewer3DRef.current?.handleSave();
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Salva globale
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <div className="h-full w-full">
            {renderContent()}
          </div>
        </div>
      </main>
    </div>
  );
}
export default function AdminPanel(props: AdminPanelProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-4 text-emerald-500" />
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    }>
      <AdminPanelContent {...props} />
    </Suspense>
  );
}
