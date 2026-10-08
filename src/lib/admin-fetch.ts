// fetch per l'area admin: aggiunge in automatico "Authorization: Bearer <token>"
// con il token salvato al login. Usare al posto di fetch per le chiamate alle API riservate.
const AUTH_TOKEN_KEY = 'admin-auth-token';

function getStoredToken(): string | null {
  try {
    const token = sessionStorage.getItem(AUTH_TOKEN_KEY);
    if (token) return token;
  } catch {
    // sessionStorage non disponibile
  }
  try {
    for (const cookie of document.cookie.split(';')) {
      const [name, value] = cookie.trim().split('=');
      if (name === AUTH_TOKEN_KEY && value) return decodeURIComponent(value);
    }
  } catch {
    // cookie non disponibili
  }
  return null;
}

export function adminFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  const token = getStoredToken();
  if (token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return fetch(input, { ...init, headers });
}
