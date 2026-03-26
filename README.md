# GK Retro Kits

Galleria di maglie da portiere storiche con visualizzatore 3D, sistema di votazione, commenti e pannello amministrativo.

## Funzionalità

### Pubbliche
- 🏠 **Home** - Galleria giocatori con filtri per nazionalità, stagione e squadra
- 🎮 **Visualizzatore 3D** - Modelli interattivi delle maglie (GLB/GLTF)
- 🖼️ **Dettagli Multipli** - Fino a 6 immagini dettagliate per kit
- 📅 **Timeline** - Vista cronologica di tutti i kit per anno
- 📖 **Biografie** - Profili giocatori con foto
- 👍👎 **Votazione** - Sistema like/dislike per kit
- 💬 **Commenti** - Sistema commenti annidati con votazione
- 🔗 **Condivisione** - Share su Facebook, Twitter, WhatsApp
- 📱 **Responsive** - Ottimizzato per mobile e desktop

### Admin
- 🔐 **Autenticazione** - Login con token di sessione
- 📊 **Statistiche** - Visualizzazioni pagina e voti kit
- 👥 **Gestione Giocatori** - CRUD completo con upload immagini
- 👕 **Gestione Kit** - CRUD con upload immagine, logo, modello 3D e dettagli
- 🔗 **Associazioni** - Collegamento giocatori-kit
- 🌍 **Nazionalità** - Gestione nazioni con bandiere
- 💬 **Moderazione Commenti** - Gestione e rimozione commenti

## Stack Tecnologico

| Categoria | Tecnologia |
|-----------|------------|
| Framework | Next.js 16 (App Router) |
| Linguaggio | TypeScript 5 |
| Styling | Tailwind CSS 4 + shadcn/ui |
| Database | Prisma ORM + SQLite |
| Animazioni | Framer Motion |
| 3D | React Three Fiber + Drei |
| State | Zustand + TanStack Query |
| Icone | Lucide React |

## Requisiti

- Node.js 18+ o Bun
- npm, yarn, pnpm o bun

## Installazione

```bash
# Clona il repository
git clone <repository-url>
cd football-kits

# Installa le dipendenze
bun install
# oppure
npm install

# Copia il file delle variabili d'ambiente
cp .env.example .env

# Configura le variabili d'ambiente (vedi sezione seguente)

# Genera il client Prisma
bun run db:generate

# Crea il database
bun run db:push

# Avvia il server di sviluppo
bun run dev
```

Il sito sarà disponibile su `http://localhost:3000`

## Variabili d'Ambiente

Copia `.env.example` in `.env` e configura le seguenti variabili:

```env
# Database
DATABASE_URL=file:./db/custom.db

# URL del sito (per SEO e condivisione)
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"

# Credenziali Admin
ADMIN_SECRET="your-secret-key-here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password-here"
```

### Descrizione Variabili

| Variabile | Descrizione |
|-----------|-------------|
| `DATABASE_URL` | Percorso del database SQLite |
| `NEXT_PUBLIC_BASE_URL` | URL base del sito (per sitemap e SEO) |
| `NEXT_PUBLIC_SITE_URL` | URL del sito (per Open Graph) |
| `ADMIN_SECRET` | Chiave segreta per la sessione admin |
| `ADMIN_USERNAME` | Username per l'accesso admin |
| `ADMIN_PASSWORD` | Password per l'accesso admin |

⚠️ **Importante**: Cambia `ADMIN_PASSWORD` in produzione!

## Script Disponibili

```bash
# Sviluppo
bun run dev          # Avvia server di sviluppo su porta 3000

# Build
bun run build        # Build di produzione
bun run start        # Avvia server di produzione

# Database
bun run db:push      # Sincronizza schema con database
bun run db:generate  # Genera client Prisma
bun run db:migrate   # Crea e applica migrazione
bun run db:reset     # Reset completo del database

# Qualità
bun run lint         # Esegue ESLint
```

## Struttura Progetto

```
├── prisma/
│   ├── schema.prisma        # Schema database
│   └── seed-*.ts            # Script di seed
├── public/
│   ├── background/          # Immagini di sfondo
│   └── logo/                # Logo del sito
├── src/
│   ├── app/
│   │   ├── api/             # API Routes
│   │   ├── admin/           # Pagine admin
│   │   ├── share/           # Pagina condivisibile
│   │   ├── page.tsx         # Home page
│   │   ├── layout.tsx       # Layout principale
│   │   ├── robots.ts        # Robots.txt dinamico
│   │   └── sitemap.ts       # Sitemap dinamica
│   ├── components/
│   │   ├── ui/              # Componenti shadcn/ui
│   │   ├── admin/           # Componenti admin
│   │   ├── KitDialog.tsx    # Dialog principale kit
│   │   ├── KitViewer3D.tsx  # Visualizzatore 3D
│   │   ├── PlayerCard.tsx   # Card giocatore
│   │   └── ...
│   ├── lib/                 # Utility e helpers
│   ├── hooks/               # Custom hooks
│   ├── config/              # Configurazioni
│   └── types/               # Tipi TypeScript
├── .env                     # Variabili d'ambiente
├── .env.example             # Template variabili
└── package.json
```

## API Endpoints

### Pubblici
- `GET /api/players` - Lista giocatori
- `GET /api/kits` - Lista kit
- `GET /api/nations` - Lista nazioni
- `GET /api/timeline` - Dati timeline
- `POST /api/kits/[id]/vote` - Vota kit
- `GET/POST /api/comments` - Commenti

### Admin
- `POST /api/admin/login` - Login
- `POST /api/admin/logout` - Logout
- `CRUD /api/players/[id]` - Gestione giocatori
- `CRUD /api/kit/[id]` - Gestione kit
- `CRUD /api/player-kits` - Associazioni

## SEO

Il sito include automaticamente:
- **Sitemap dinamica** (`/sitemap.xml`) - Aggiornata con tutti i kit
- **Robots.txt** (`/robots.txt`) - Configurato per bloccare /admin e /api
- **Open Graph** - Immagini di anteprima per condivisioni social

## Licenza

MIT
