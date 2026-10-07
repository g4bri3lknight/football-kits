// Inserisce dati di test (nazioni, campionati, kit, giocatori).
// Uso:  npm run db:seed-test            (solo se il DB è vuoto)
//       npm run db:seed-test -- --reset (CANCELLA tutti i dati e inserisce quelli di test)
import { PrismaClient } from '@prisma/client';
import { seedTestData } from './seed-test-data';

const prisma = new PrismaClient();

seedTestData(prisma, { reset: process.argv.includes('--reset') })
  .then((r) =>
    console.log(`✅ Dati di test inseriti: ${r.nations} nazioni, ${r.leagues} campionati, ${r.kits} kit, ${r.players} giocatori`)
  )
  .catch((e) => {
    console.error('❌', e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
