# Istruzioni per il Deploy

Dopo aver pubblicato il sito, devi popolare le nazionalità nel database.

## Opzione 1: Attraverso l'API Endpoint (Consigliato)

Dopo aver avviato il server in produzione, esegui:

```bash
curl -X POST http://tuosito.com/api/seed
```

Oppure, se stai testando localmente:

```bash
curl -X POST http://localhost:3000/api/seed
```

Risposta attesa:
```json
{
  "success": true,
  "message": "Nations seeded successfully",
  "count": 170
}
```

## Opzione 2: Attraverso lo script locale

Se hai accesso al server, puoi eseguire direttamente lo script di seed:

```bash
cd /path/to/your/project
bun run db:seed
```

## Verifica

Per verificare che le nazioni siano state inserite correttamente, puoi chiamare l'endpoint:

```bash
curl http://tuosito.com/api/nations
```

Dovresti vedere una lista con 170 nazioni.

## Nota importante

Le nazioni devono essere inserite **solo una volta** dopo il deploy iniziale. Se esegui lo script più volte, userà `upsert` quindi non creerà duplicati ma aggiornerà solo se necessario.

Il database viene creato vuoto al primo deploy, quindi è necessario eseguire questa operazione almeno una volta.
