import { ImageResponse } from 'next/og';
import { db } from '@/lib/db';

// Configurazione dimensioni immagine
export const alt = 'Kit Preview';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

// Genera immagine Open Graph dinamica
export default async function Image({ params }: { params: Promise<{ kitId: string }> }) {
  const { kitId } = await params;
  
  try {
    // Trova il kit con le informazioni del giocatore e i dati immagine
    const playerKit = await db.playerKit.findFirst({
      where: { kitId },
      include: {
        Kit: {
          select: {
            id: true,
            name: true,
            team: true,
            year: true,
            hasImage: true,
            imageData: true,
            imageMimeType: true,
          },
        },
        Player: true,
      },
    });

    if (!playerKit || !playerKit.Kit) {
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#002f42',
              color: 'white',
            }}
          >
            <div style={{ display: 'flex', fontSize: 60, fontWeight: 'bold' }}>
              Kit non trovato
            </div>
          </div>
        ),
        { ...size }
      );
    }

    const kit = playerKit.Kit;
    const player = playerKit.Player;
    const playerName = player ? `${player.name} ${player.surname || ''}`.trim() : 'Giocatore sconosciuto';

    // Converti l'immagine in base64 data URI
    let imageDataUri: string | null = null;
    if (kit.hasImage && kit.imageData && kit.imageMimeType) {
      const base64 = Buffer.from(kit.imageData).toString('base64');
      imageDataUri = `data:${kit.imageMimeType};base64,${base64}`;
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#002f42',
            padding: '40px',
          }}
        >
          {/* Container principale */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              width: '100%',
              height: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
          >
            {/* Immagine del kit */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50%',
                height: '100%',
                backgroundColor: '#f3f4f6',
                borderRadius: '15px',
                marginRight: '30px',
                overflow: 'hidden',
              }}
            >
              {imageDataUri ? (
                <img
                  src={imageDataUri}
                  alt={kit.name}
                  style={{
                    maxWidth: '100%',
                    maxHeight: '100%',
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#e5e7eb',
                    borderRadius: '15px',
                  }}
                >
                  <span style={{ fontSize: 120, color: '#9ca3af' }}>👕</span>
                </div>
              )}
            </div>

            {/* Info kit */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'center',
                width: '50%',
                padding: '20px',
              }}
            >
              {/* Logo/Titolo */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <div
                  style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    color: '#cd2127',
                  }}
                >
                  GK Retro Kits
                </div>
              </div>

              {/* Nome giocatore */}
              <div
                style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#1f2937',
                  marginBottom: '10px',
                }}
              >
                {playerName}
              </div>

              {/* Nome kit */}
              <div
                style={{
                  fontSize: '28px',
                  color: '#374151',
                  marginBottom: '10px',
                }}
              >
                {kit.name}
              </div>

              {/* Squadra */}
              {kit.team && (
                <div
                  style={{
                    fontSize: '24px',
                    color: '#6b7280',
                    marginBottom: '20px',
                  }}
                >
                  {kit.team}
                </div>
              )}

              {/* Anno */}
              {kit.year && (
                <div
                  style={{
                    fontSize: '20px',
                    color: '#9ca3af',
                    backgroundColor: '#f3f4f6',
                    padding: '8px 16px',
                    borderRadius: '8px',
                  }}
                >
                  Stagione {kit.year}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);
    
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#002f42',
            color: 'white',
          }}
        >
          <div style={{ display: 'flex', fontSize: 60, fontWeight: 'bold' }}>
            GK Retro Kits
          </div>
        </div>
      ),
      { ...size }
    );
  }
}
