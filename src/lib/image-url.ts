/**
 * Funzione utility per ottenere l'URL completo di un'immagine
 * Se l'URL è già assoluto (comincia con http), lo restituisce così com'è
 * Se è relativo, lo converte per usare l'endpoint API /api/images/
 */
export function getImageUrl(url: string | null | undefined): string {
  if (!url) return '';
  
  // Se è già un URL assoluto, restituiscilo così com'è
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Per URL relativi, usa l'endpoint API per servire le immagini
  // Questo garantisce che le immagini funzionino sempre in produzione
  // Esempio: /players/image.png → /api/images/players/image.png
  const cleanUrl = url.startsWith('/') ? url.slice(1) : url;
  return `/api/images/${cleanUrl}`;
}
