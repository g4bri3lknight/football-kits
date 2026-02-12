import { PrismaClient } from '@prisma/client'

// In sviluppo, crea sempre un nuovo client per evitare problemi di caching
// In produzione, usa il singleton pattern
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  })

if (process.env.NODE_ENV === 'production') {
  globalForPrisma.prisma = db
}