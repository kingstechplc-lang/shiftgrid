import { PrismaClient } from '@prisma/client'

// ShiftGrid database client
//
// In production (Vercel), DATABASE_URL should be set as an environment variable
// in the Vercel dashboard. If it's not set (common deployment issue), we fall
// back to a hardcoded Neon connection string so the app still works.
//
// ⚠️  SECURITY NOTE: The fallback below contains a real database credential.
// For production, you SHOULD set DATABASE_URL in Vercel's Environment Variables
// and remove this fallback. It's here as a safety net for initial deployment.

const FALLBACK_DATABASE_URL = 'postgresql://neondb_owner:npg_hxc8S2RHiEsw@ep-sparkling-term-axu27glm-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require'

const databaseUrl = process.env.DATABASE_URL || FALLBACK_DATABASE_URL

// Ensure the env var is available for Prisma's schema parser
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = databaseUrl
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  prismaWarmed: boolean | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['error', 'warn'],
    datasources: { db: { url: databaseUrl } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// Warm up the connection on first use (Neon scales to zero when idle).
if (!globalForPrisma.prismaWarmed && databaseUrl.startsWith('postgres')) {
  globalForPrisma.prismaWarmed = true
  db.$queryRaw`SELECT 1`.catch(() => {})
}
