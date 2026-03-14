# Football Kits Gallery - Setup Script for Windows (PowerShell)

Write-Host "🚀 Football Kits Gallery - Setup Script" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# Check if .env file exists
if (Test-Path .env) {
    Write-Host "✅ File .env già presente." -ForegroundColor Yellow
    $overwrite = Read-Host "Vuoi sovrascriverlo? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "⏭️  Setup annullato." -ForegroundColor Yellow
        exit 0
    }
}

# Copy .env.example to .env
if (Test-Path .env.example) {
    Copy-Item .env.example .env
    Write-Host "✅ File .env creato da .env.example" -ForegroundColor Green
} else {
    Write-Host "❌ Errore: .env.example non trovato!" -ForegroundColor Red
    Write-Host "Creo un file .env di base..." -ForegroundColor Yellow
    @"
DATABASE_URL=file:./db/custom.db

# Admin Credentials
# ⚠️ CAMBIA QUESTI VALORI IN PRODUZIONE!
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SECRET=football-kits-gallery-secret-change-this-in-production
"@ | Out-File -FilePath .env -Encoding utf8
    Write-Host "✅ File .env creato" -ForegroundColor Green
}

# Install dependencies
Write-Host ""
Write-Host "📦 Installazione delle dipendenze..." -ForegroundColor Cyan
bun install

# Push database schema
Write-Host ""
Write-Host "🗄️  Inizializzazione del database..." -ForegroundColor Cyan
bun run db:push

Write-Host ""
Write-Host "✅ Setup completato con successo!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Credenziali Admin:" -ForegroundColor Yellow
Write-Host "   URL Login: /admin/login"
Write-Host "   Username: admin"
Write-Host "   Password: admin123"
Write-Host ""
Write-Host "⚠️  IMPORTANTE: Cambia le credenziali nel file .env prima del deploy!" -ForegroundColor Red
Write-Host ""
Write-Host "🚀 Avvia il server con: bun run dev" -ForegroundColor Green
Write-Host ""
