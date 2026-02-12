# ⚽ Football Kits Gallery

Una galleria interattiva di kit calcistici con visualizzazione 3D, focus sui giocatori e pannello di amministrazione protetto.

## 🚀 Quick Start

```bash
# 1. Installa le dipendenze
bun install

# 2. Configura il file .env (IMPORTANTE!)
cp .env.example .env

# 3. Inizializza il database
bun run db:push

# 4. Avvia il server di sviluppo
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application running.

⚠️ **IMPORTANTE**: Il file `.env` non è incluso nel pacchetto per sicurezza. Devi crearlo da `.env.example` o seguire la [guida completa](SETUP.md).

## 🔐 Credenziali Admin

- **Login**: `/admin/login`
- **Dashboard**: `/admin/dashboard`
- **Username**: `admin`
- **Password**: `admin123`

⚠️ **CAMBIA QUESTE CREDENZIALI IN PRODUZIONE!** Modifica il file `.env` prima del deploy.

## 📚 Documentazione Completa

Per istruzioni dettagliate su installazione, configurazione e risoluzione problemi, vedi [SETUP.md](SETUP.md).

## ✨ Funzionalità

### 🌐 Pubblico
- Visualizzazione giocatori e loro kit
- Ricerca giocatori e squadre
- Visualizzazione dettagli kit (immagine + 3D)
- Visualizzatore 3D con rotazione verticale e zoom configurabile

### 🔒 Admin (Protetto)
- Login sicuro con username e password
- CRUD completo per Giocatori, Kit e Associazioni
- Session management con token e cookie
- Gestione storico annuale dei kit per giocatore

## 🛠️ Tecnologie

- **Frontend**: Next.js 16, React, TypeScript, Tailwind CSS 4
- **UI**: shadcn/ui components, Lucide icons
- **Database**: Prisma ORM, SQLite
- **3D**: Three.js, React Three Fiber, Drei
- **Auth**: Cookies di Next.js con token custom

## 📁 Struttura Progetto

```
src/
├── app/
│   ├── page.tsx          # Homepage pubblica
│   ├── admin/
│   │   ├── login/        # Pagina login admin
│   │   └── dashboard/    # Dashboard admin protetta
│   └── api/              # API REST
├── components/
│   ├── admin/
│   │   └── AdminPanel.tsx
│   ├── KitViewer3D.tsx
│   └── ui/               # shadcn/ui components
└── lib/
    ├── db.ts             # Prisma client
    └── utils.ts
```

## 📖 Comandi

```bash
bun run dev          # Avvia sviluppo
bun run build        # Build per produzione
bun run lint         # Esegue ESLint
bun run db:push      # Sincronizza database
bun run db:studio    # Apri Prisma Studio
```

## ⚠️ Note Importanti

1. **Il file `.env` deve essere creato manualmente** da `.env.example`
2. **Cambia le credenziali admin** prima del deploy in produzione
3. Il database SQLite verrà creato automaticamente in `db/`

## 🤝 Supporto

Per problemi o domande, consulta [SETUP.md](SETUP.md) per la guida completa.

---

Football Kits Gallery © 2024
