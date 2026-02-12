#!/bin/bash

# Football Kits Gallery - Setup Script

echo "🚀 Football Kits Gallery - Setup Script"
echo "========================================"
echo ""

# Check if .env file exists
if [ -f .env ]; then
    echo "✅ File .env già presente."
    read -p "Vuoi sovrascriverlo? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "⏭️  Setup annullato."
        exit 0
    fi
fi

# Copy .env.example to .env
if [ -f .env.example ]; then
    cp .env.example .env
    echo "✅ File .env creato da .env.example"
else
    echo "❌ Errore: .env.example non trovato!"
    echo "Creo un file .env di base..."
    cat > .env << EOL
DATABASE_URL=file:./db/custom.db

# Admin Credentials
# ⚠️ CAMBIA QUESTI VALORI IN PRODUZIONE!
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET=football-kits-gallery-secret-change-this-in-production
EOL
    echo "✅ File .env creato"
fi

# Install dependencies
echo ""
echo "📦 Installazione delle dipendenze..."
bun install

# Push database schema
echo ""
echo "🗄️  Inizializzazione del database..."
bun run db:push

echo ""
echo "✅ Setup completato con successo!"
echo ""
echo "📝 Credenziali Admin:"
echo "   URL Login: /admin/login"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANTE: Cambia le credenziali nel file .env prima del deploy!"
echo ""
echo "🚀 Avvia il server con: bun run dev"
echo ""
