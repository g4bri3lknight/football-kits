'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AUTH_TOKEN_KEY = 'admin-auth-token';

// Funzione per generare un token semplice
function generateToken(): string {
  const timestamp = Date.now();
  const secret = 'football-kits-admin';
  return btoa(`${timestamp}:${secret}`);
}

// Salva il token in sessionStorage e cookie
function saveToken(token: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    }
  } catch {
    // sessionStorage non disponibile
  }
  // Salva anche in cookie per persistenza migliore
  try {
    if (typeof document !== 'undefined') {
      document.cookie = `${AUTH_TOKEN_KEY}=${encodeURIComponent(token)}; path=/; max-age=86400; SameSite=Lax`;
    }
  } catch {
    // cookie non disponibile
  }
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Pulisci vecchi token quando si accede alla pagina di login
  useEffect(() => {
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
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login fallito');
      }

      // Usa il token restituito dall'API (o genera uno locale come fallback)
      const token = data.token || generateToken();
      
      // Salva il token in sessionStorage per persistenza
      saveToken(token);
      
      toast({
        title: 'Successo',
        description: 'Login effettuato con successo',
      });

      // Redirect alla dashboard usando window.location per un reload completo
      window.location.href = `/admin/dashboard?t=${encodeURIComponent(token)}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login fallito');
      toast({
        title: 'Errore',
        description: err instanceof Error ? err.message : 'Login fallito',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 p-3 sm:p-4">
      <Card className="w-full max-w-md sm:max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center pb-3 sm:pb-4">
          <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mb-4 shadow-lg">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription className="text-sm">
            Inserisci le tue credenziali per accedere al pannello di amministrazione
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="Inserisci username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Inserisci password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                  suppressHydrationWarning
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'Accesso in corso...' : 'Accedi'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Button
              variant="ghost"
              onClick={() => router.push('/')}
              className="text-sm"
            >
              ← Torna alla home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
