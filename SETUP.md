# Setup Rapido

## 1. Installazione

```bash
# Installa dipendenze
bun install

# Copia variabili d'ambiente
cp .env.example .env
```

## 2. Configurazione

Modifica il file `.env` con i tuoi valori:

```env
DATABASE_URL=file:./db/custom.db
NEXT_PUBLIC_BASE_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
ADMIN_SECRET="your-secret-key-here"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-password-here"
```

## 3. Database

```bash
# Genera client Prisma
bun run db:generate

# Crea il database
bun run db:push
```

## 4. Avvia

```bash
bun run dev
```

Il sito sarà disponibile su `http://localhost:3000`

## Accesso Admin

- URL: `http://localhost:3000/admin/login`
- Username: valore di `ADMIN_USERNAME`
- Password: valore di `ADMIN_PASSWORD`

## Popolamento Dati (Opzionale)

Per aggiungere dati di test, puoi usare gli script di seed disponibili in `prisma/`:

```bash
# Esegui uno script di seed
bun run prisma/seed-benchmark-small.ts
```

## Problemi Comuni

### Errore "Prisma Client not found"
```bash
bun run db:generate
```

### Errore "Database not found"
```bash
bun run db:push
```

### Porta 3000 già in uso
Modifica la porta in `package.json`:
```json
"dev": "next dev -p 3001"
```
