# Football Kits Gallery - Guida all'Installazione

Guida completa per configurare e avviare l'applicazione Football Kits Gallery.

## 📋 Prerequisiti

- Node.js 18+ o Bun
- Git (opzionale, se cloni da repository)

## 🚀 Installazione Rapida

### 1. Installa le dipendenze

```bash
bun install
# oppure
npm install
```

### 2. Configura il file `.env` ⚠️ IMPORTANTE

Il file `.env` non è incluso nel pacchetto per motivi di sicurezza. Devi crearlo manualmente:

**Opzione A - Copia dal template:**

```bash
# Su Linux/Mac
cp .env.example .env

# Su Windows (PowerShell)
Copy-Item .env.example .env

# Su Windows (Command Prompt)
copy .env.example .env
```

**Opzione B - Crea il file manualmente:**

Crea un file chiamato `.env` nella root del progetto con il seguente contenuto:

```env
DATABASE_URL=file:./db/custom.db

# Admin Credentials
# ⚠️ CAMBIA QUESTI VALORI IN PRODUZIONE!
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET=football-kits-gallery-secret-change-this-in-production
```

### 3. Inizializza il database

```bash
bun run db:push
# oppure
npx prisma db push
```

Questo comando creerà il database SQLite e tutte le tabelle necessarie.

### 4. Avvia il server di sviluppo

```bash
bun run dev
# oppure
npm run dev
```

L'applicazione sarà disponibile su `http://localhost:3000`

## 🔐 Credenziali Admin Predefinite

Dopo aver creato il file `.env`, puoi accedere al pannello admin con:

- **URL Login**: `/admin/login`
- **URL Dashboard**: `/admin/dashboard`
- **Username**: `admin`
- **Password**: `admin123`

## ⚠️ IMPORTANTE - Sicurezza in Produzione

Prima di deployare in produzione, **devi assolutamente** modificare le credenziali nel file `.env`:

```env
ADMIN_USERNAME=nome_utente_complesso
ADMIN_PASSWORD=password_molto_sicura_e_lunga
ADMIN_SECRET=stringa_casuale_molto_lunga_e_complessa
```

Puoi generare un secret sicuro con:

```bash
# Su Linux/Mac
openssl rand -base64 32

# Su Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## 📁 Struttura del Progetto

```
football-kits-gallery/
├── .env                 # Variabili environment (NON incluso nel pacchetto)
├── .env.example         # Template per .env
├── db/                  # Database SQLite
├── prisma/
│   └── schema.prisma    # Schema del database
├── src/
│   ├── app/
│   │   ├── page.tsx                # Homepage pubblica
│   │   ├── admin/
│   │   │   ├── login/
│   │   │   │   └── page.tsx        # Pagina login admin
│   │   │   └── dashboard/
│   │   │       └── page.tsx        # Dashboard admin protetta
│   │   └── api/
│   │       ├── admin/
│   │       │   ├── login/
│   │       │   │   └── route.ts    # API login/logout
│   │       │   └── logout/
│   │       │       └── route.ts
│   │       ├── players/            # API giocatori
│   │       ├── kits/               # API kit
│   │       └── player-kits/        # API associazioni
│   ├── components/
│   │   ├── admin/
│   │   │   └── AdminPanel.tsx      # Pannello admin
│   │   ├── KitViewer3D.tsx         # Visualizzatore 3D
│   │   └── ui/                     # Componenti shadcn/ui
│   └── lib/
│       ├── db.ts                   # Client Prisma
│       └── utils.ts                # Utility functions
├── package.json
├── SETUP.md            # Questo file
└── README.md           # Documentazione generale
```

## 🎯 Funzionalità Principali

### Pubblico
- ✅ Visualizzazione giocatori e loro kit
- ✅ Ricerca giocatori e squadre
- ✅ Visualizzazione dettagli kit (immagine + 3D)
- ✅ Visualizzatore 3D con rotazione verticale
- ✅ Zoom 3D configurabile

### Admin (Protetto)
- ✅ Login sicuro con username e password
- ✅ CRUD Giocatori
- ✅ CRUD Kit (con URL immagine e modello 3D)
- ✅ Associazioni Giocatore-Kit-Anno
- ✅ Session management con cookie
- ✅ Token con scadenza 24 ore

## 🔧 Comandi Disponibili

```bash
# Installa dipendenze
bun install

# Avvia sviluppo
bun run dev

# Esegue lint
bun run lint

# Sincronizza database
bun run db:push

# Genera client Prisma
bun run db:generate

# Apri Prisma Studio
bun run db:studio
```

## 🐛 Risoluzione Problemi

### Il file .env non funziona

Assicurati che:
1. Il file si chiami esattamente `.env` (non `.env.txt` o altro)
2. Il file sia nella root del progetto
3. Non ci siano spazi extra all'inizio delle righe
4. Le variabili siano scritte in MAIUSCOLO

### Database non trovato

Esegui:
```bash
bun run db:push
```

Questo creerà il database e le tabelle necessarie.

### Errore di login admin

Verifica nel file `.env` che:
- `ADMIN_USERNAME` sia impostato
- `ADMIN_PASSWORD` sia impostato
- `ADMIN_SECRET` sia impostato

Se hai appena modificato il file, riavvia il server di sviluppo.

### Errore "Module not found"

Esegui:
```bash
rm -rf node_modules bun.lockb
bun install
```

## 📚 Tecnologie Utilizzate

- **Frontend**: Next.js 16, React, TypeScript
- **Styling**: Tailwind CSS 4, shadcn/ui
- **Database**: Prisma ORM, SQLite
- **3D**: Three.js, React Three Fiber, Drei
- **Icons**: Lucide React
- **Auth**: Cookies di Next.js con token custom

## 🤝 Supporto

Per problemi o domande, consulta la documentazione o apri una issue nel repository.

## 📄 Licenza

Tutti i diritti riservati - Football Kits Gallery © 2024

---

**Buon divertimento con Football Kits Gallery! ⚽👕**
