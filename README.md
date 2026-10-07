# GK Retro Kits

Galleria di maglie da portiere storiche con visualizzatore 3D, sistema di votazione, commenti e pannello amministrativo.

## Funzionalità

### Pubbliche
- 🏠 **Home** - Galleria giocatori con ricerca sempre visibile e pannello filtri collassabile (nazionalità giocatore, campionato, nazionalità campionato, stagione, squadra)
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
- 🏆 **Campionati** - CRUD di stagione, campionato e nazione (la nazione si sceglie tra quelle già presenti in Nazionalità)
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

## Dati di test

Per provare filtri, campionati e kit con dei dati pronti:

```bash
npm run db:push                       # crea le tabelle (se non esistono)
npm run db:seed-test                  # inserisce i dati di test (solo se il DB è vuoto)
npm run db:seed-test -- --reset       # ATTENZIONE: cancella TUTTI i dati e reinserisce quelli di test
```

Inserisce 11 nazioni, 10 campionati (con logo), 21 kit con maglie generate e 13 portieri. Alcuni casi sono voluti: Croazia e Scozia non hanno giocatori, il campionato portoghese non ha kit (non devono comparire nei filtri), le nazionali non hanno campionato (stagione manuale). I dati sono definiti in `prisma/seed-test-data.ts`.

## Accesso Admin (scorciatoie)

Nell'interfaccia pubblica non è presente alcun tasto "Admin". L'area admin si raggiunge con una scorciatoia, valida sia in **Home** sia in **Timeline**:

| Dispositivo | Scorciatoia |
|-------------|-------------|
| Desktop | `Ctrl` + `Shift` + `L` |
| Mobile | 5 tocchi rapidi sul logo nell'header (ogni tocco entro 0,6 secondi dal precedente) |

Se esiste già una sessione admin valida si viene portati alla dashboard, altrimenti alla pagina di login.

### Come modificare le scorciatoie

Entrambe sono definite in `src/app/page.tsx`, subito dopo la funzione `handleAdminClick`:

- **Desktop** – nell'`useEffect` con il listener `keydown`. La condizione controlla i modificatori (`e.ctrlKey`, `e.shiftKey`, `e.altKey`, `e.metaKey`) e il tasto (`e.code === 'KeyL'`). Per usare un'altra lettera cambia `'KeyL'` (ad esempio `'KeyK'`); per cambiare i modificatori modifica i controlli corrispondenti. `e.code` identifica il tasto fisico, quindi non dipende dal layout della tastiera.
- **Mobile** – nella funzione `handleLogoTap`. Il numero di tocchi richiesti è il valore in `t.count >= 5`, mentre l'intervallo massimo tra due tocchi (in millisecondi) è il `600` nel confronto `now - t.last < 600`.

⚠️ **Nota di sicurezza**: le scorciatoie nascondono soltanto l'ingresso all'area admin. La protezione reale è l'autenticazione (`ADMIN_USERNAME` / `ADMIN_PASSWORD`), quindi usa sempre credenziali robuste.

## Campionati

Nel pannello admin, sotto **Gestione → Campionati**, si gestiscono i campionati. Ogni record ha tre campi di testo più il logo:

| Campo | Descrizione |
|-------|-------------|
| Stagione | Es. `2025/26` |
| Campionato | Es. `Serie A` |
| Nazione | Nome di una nazione già presente nella tabella delle nazionalità |
| Logo | Immagine opzionale (max 2 MB), salvata direttamente nel database come dato binario |

La nazione viene scelta da un elenco alimentato dalla sezione **Nazionalità** e salvata come stringa (il nome): l'API rifiuta nazioni che non esistono, così i dati delle nazioni non vengono duplicati. Non possono esistere due campionati con la stessa combinazione di stagione, campionato e nazione.

### Campionato nei kit

Nel form di creazione/modifica di un kit c'è il campo **Campionato**, una select con ricerca (per campionato, stagione o nazione) alimentata dalla tabella dei campionati. Il campo è opzionale: i kit esistenti restano senza campionato finché non lo imposti. Se elimini un campionato, i kit collegati non vengono cancellati: restano semplicemente senza campionato.

**Stagione del kit.** Quando un kit ha un campionato, la sua stagione (il campo *Stagione*, che nel database è `Kit.name`) coincide sempre con quella del campionato: scegliendo il campionato il valore viene sovrascritto e il campo si blocca nel form, e la stessa regola è applicata dal server (`POST /api/kits`, `PUT /api/kit/[id]`). Se modifichi la stagione di un campionato, la stagione di tutti i suoi kit viene aggiornata insieme. Togliendo il campionato dal kit il campo torna modificabile e mantiene l'ultimo valore; i kit senza campionato (per esempio quelli delle nazionali) hanno la stagione manuale. Per riallineare kit assegnati prima di questa regola, salva di nuovo il campionato o il singolo kit.

Nel dettaglio di un kit (aperto dalla home o dalla timeline) il titolo mostra il logo e la stagione del campionato al posto del nome del kit; se il campionato non ha un logo compare solo la stagione, e per i kit senza campionato il titolo resta il nome del kit.

⚠️ **Aggiornamento di un database esistente**: la tabella `League` è nuova. Dopo aver aggiornato il codice esegui `bun run db:generate` e `bun run db:push` (o gli equivalenti `npm run`): i dati esistenti non vengono toccati. Se avevi già creato la tabella con la versione precedente, `db:push` aggiunge anche le nuove colonne del logo. Con i kit collegati ai campionati, `db:push` aggiunge inoltre la colonna `leagueId` alla tabella `Kit`: su SQLite la tabella viene ricreata mantenendo i dati, ma per prudenza copia prima il file del database.

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
- `GET /api/leagues` - Lista campionati (pubblico)
- `POST /api/leagues` - Crea campionato (richiede `Authorization: Bearer <token admin>`)
- `PUT/DELETE /api/leagues/[id]` - Modifica/elimina campionato (richiede `Authorization: Bearer <token admin>`)
- `GET /api/leagues/[id]/logo` - Logo del campionato (pubblico)
- `POST /api/kits` e `PUT /api/kit/[id]` accettano il campo opzionale `leagueId` (id di un campionato esistente; vuoto o `null` per rimuoverlo)

## SEO

Il sito include automaticamente:
- **Sitemap dinamica** (`/sitemap.xml`) - Aggiornata con tutti i kit
- **Robots.txt** (`/robots.txt`) - Configurato per bloccare /admin e /api
- **Open Graph** - Immagini di anteprima per condivisioni social

## Licenza

MIT
