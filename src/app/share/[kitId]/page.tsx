import { Metadata } from 'next';
import { db } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { headers } from 'next/headers';

interface SharePageProps {
  params: Promise<{
    kitId: string;
  }>;
}

// Ottiene l'URL base dalla richiesta
function getBaseUrl(requestHeaders: Headers): string {
  // Prova prima con x-forwarded-host (usato da proxy)
  const forwardedHost = requestHeaders.get('x-forwarded-host');
  const forwardedProto = requestHeaders.get('x-forwarded-proto') || 'https';
  
  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }
  
  // Fallback all'host header
  const host = requestHeaders.get('host');
  if (host) {
    // Se l'host è localhost, usa http, altrimenti https
    const proto = host.includes('localhost') ? 'http' : 'https';
    return `${proto}://${host}`;
  }
  
  // Ultimo fallback
  return process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
}

// Genera i meta tag dinamicamente per l'anteprima social
export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { kitId } = await params;
  const requestHeaders = await headers();
  
  try {
    // Trova il kit con le informazioni del giocatore
    const playerKit = await db.playerKit.findFirst({
      where: { kitId },
      include: {
        Kit: true,
        Player: true,
      },
    });

    if (!playerKit || !playerKit.Kit) {
      return {
        title: 'Kit non trovato - GK Retro Kits',
      };
    }

    const kit = playerKit.Kit;
    const player = playerKit.Player;
    const playerName = player ? `${player.name} ${player.surname || ''}`.trim() : '';
    const title = `${playerName} - ${kit.name} ${kit.team} | GK Retro Kits`;
    const description = `Scopri il kit ${kit.name} di ${kit.team} indossato da ${playerName}. Visualizza tutti i dettagli su GK Retro Kits!`;

    // Costruisci l'URL base dalla richiesta
    const baseUrl = getBaseUrl(requestHeaders);
    
    // L'immagine Open Graph viene generata automaticamente da opengraph-image.tsx
    // Next.js userà automaticamente questo endpoint per i meta tag
    const ogImageUrl = `${baseUrl}/share/${kitId}/opengraph-image`;

    console.log('Share metadata - baseUrl:', baseUrl);
    console.log('Share metadata - ogImageUrl:', ogImageUrl);

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website',
        url: `${baseUrl}/share/${kitId}`,
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `${kit.name} - ${kit.team}`,
          },
        ],
        siteName: 'GK Retro Kits',
        locale: 'it_IT',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImageUrl],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'GK Retro Kits',
    };
  }
}

// Pagina che reindirizza alla home con il parametro kit
export default async function SharePage({ params }: SharePageProps) {
  const { kitId } = await params;
  
  // Verifica che il kit esista
  const kit = await db.kit.findUnique({
    where: { id: kitId },
    select: { id: true },
  });

  if (!kit) {
    notFound();
  }

  // Reindirizza alla home con il parametro kit
  redirect(`/?kit=${kitId}`);
}
