'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import AdminPanel from '@/components/admin/AdminPanel';
import { useToast } from '@/hooks/use-toast';

const AUTH_TOKEN_KEY = 'admin-auth-token';

// Verifica il token tramite API
async function verifyTokenViaAPI(token: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/login?token=${encodeURIComponent(token)}`);
    const data = await response.json();
    return data.authenticated === true;
  } catch {
    return false;
  }
}

// Salva il token
function saveToken(token: string): void {
  try {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // Ignora errori
  }
  try {
    document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
  } catch {
    // Ignora errori
  }
}

// Recupera il token salvato
function getStoredToken(): string | null {
  try {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return token;
  } catch {
    // Ignora errori
  }
  
  try {
    const cookies = document.cookie.split(';');
    for (const cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === AUTH_TOKEN_KEY && value) {
        return decodeURIComponent(value);
      }
    }
  } catch {
    // Ignora errori
  }
  
  return null;
}

// Rimuovi il token
function clearToken(): void {
  try {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // Ignora errori
  }
  try {
    document.cookie = `${AUTH_TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
  } catch {
    // Ignora errori
  }
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  // Verifica il token tramite API
  useEffect(() => {
    const verifyAuth = async () => {
      const urlToken = searchParams.get('t');
      
      // Priorità al token dell'URL
      if (urlToken) {
        const isValid = await verifyTokenViaAPI(urlToken);
        if (isValid) {
          saveToken(urlToken);
          setToken(urlToken);
          setIsAuthenticated(true);
          setChecking(false);
          return;
        }
      }

      // Controlla il token salvato
      const storedToken = getStoredToken();
      if (storedToken) {
        const isValid = await verifyTokenViaAPI(storedToken);
        if (isValid) {
          setToken(storedToken);
          setIsAuthenticated(true);
          // Assicurati che l'URL abbia il token
          if (!urlToken) {
            router.replace(`/admin/dashboard?t=${encodeURIComponent(storedToken)}`);
          }
          setChecking(false);
          return;
        }
      }

      // Token non valido, redirect alla login
      setChecking(false);
      router.push('/admin/login');
    };

    verifyAuth();
  }, [searchParams, router]);

  // Mostra loading mentre verifica
  if (checking || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifica autenticazione...</p>
        </div>
      </div>
    );
  }

  const handleLogout = () => {
    clearToken();
    toast({
      title: 'Successo',
      description: 'Logout effettuato con successo',
    });
    router.push('/admin/login');
  };

  const handleBackToSite = () => {
    // Torna alla home passando il token nell'URL
    window.location.href = `/?t=${encodeURIComponent(token)}`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-40">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">
                  Admin Dashboard
                </h1>
                <p className="text-xs text-muted-foreground">
                  Football Kits Gallery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToSite}
                className="h-9 px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Torna al sito</span>
                <span className="sm:hidden">Sito</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-9 px-3"
              >
                <LogOut className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Full width */}
      <main className="flex-1 px-4 sm:px-6 py-4">
        <AdminPanel adminToken={token || ''} />
      </main>

      {/* Footer */}
      <footer className="bg-card border-t py-3">
        <div className="px-4 sm:px-6 text-center text-xs text-muted-foreground">
          © 2024 Football Kits Gallery - Admin Dashboard
        </div>
      </footer>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Caricamento...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
