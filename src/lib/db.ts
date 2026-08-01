import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'

// Force-load .env and override any inherited DATABASE_URL (e.g. sandbox default SQLite).
// Next.js's built-in .env loader does NOT override existing process.env values,
// so we use dotenv with override: true to ensure our Neon URL wins.
config({ path: '.env', override: true })

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
