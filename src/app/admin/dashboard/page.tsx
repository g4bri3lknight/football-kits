'use client';

import { useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import AdminPanel from '@/components/admin/AdminPanel';
import { useToast } from '@/hooks/use-toast';

const AUTH_TOKEN_KEY = 'admin-auth-token';

// Verifica se il token è valido
function verifyToken(token: string): boolean {
  try {
    const decoded = atob(token);
    const [timestamp, secret] = decoded.split(':');

    if (secret !== 'football-kits-admin') {
      return false;
    }

    const tokenAge = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 ore

    return tokenAge < maxAge;
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

  const urlToken = searchParams.get('t') || '';
  const storedToken = useMemo(() => getStoredToken(), []);
  
  const token = urlToken || storedToken;
  
  const isAuthenticated = useMemo(() => {
    if (!token) return false;
    return verifyToken(token);
  }, [token]);

  // Salva il token dall'URL
  useEffect(() => {
    if (urlToken && verifyToken(urlToken)) {
      saveToken(urlToken);
    }
  }, [urlToken]);

  // Se autenticato con token salvato ma non nell'URL, reindirizza con token
  useEffect(() => {
    if (storedToken && !urlToken && verifyToken(storedToken)) {
      router.replace(`/admin/dashboard?t=${encodeURIComponent(storedToken)}`);
    }
  }, [storedToken, urlToken, router]);

  // Redirect se non autenticato
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: 'Accesso negato',
        description: 'Token non valido o scaduto. Effettua nuovamente il login.',
        variant: 'destructive',
      });
      router.push('/admin/login');
    }
  }, [isAuthenticated, router, toast]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifica autenticazione...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                  Admin Dashboard
                </h1>
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 hidden sm:block">
                  Football Kits Gallery
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBackToSite}
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Torna al sito</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="h-8 sm:h-9 px-2 sm:px-3"
              >
                <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <AdminPanel />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-3 sm:py-4 mt-auto">
        <div className="container mx-auto px-3 sm:px-4 text-center text-xs sm:text-sm text-gray-600 dark:text-gray-400">
          © 2024 Football Kits Gallery - Admin Dashboard
        </div>
      </footer>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Caricamento...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
