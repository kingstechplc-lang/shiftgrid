import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Force-load .env and override any inherited DATABASE_URL (e.g. sandbox default SQLite).
// Next.js's built-in .env loader does NOT override existing process.env values,
// so we use dotenv with override: true to ensure our Neon URL wins.
config({ path: '.env', override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaWarmed: boolean | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Warm up the connection on first use (Neon scales to zero when idle).
// This fires a cheap SELECT 1 in the background so the first real user request
// doesn't pay the ~2-3s cold-start penalty.
if (!globalForPrisma.prismaWarmed && process.env.DATABASE_URL?.startsWith('postgres')) {
  globalForPrisma.prismaWarmed = true
  db.$queryRaw`SELECT 1`.catch(() => {})
}
