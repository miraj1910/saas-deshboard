import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined }

const databaseUrl = process.env.DATABASE_URL
const url = databaseUrl
  ? databaseUrl.includes('pgbouncer=true')
    ? databaseUrl
    : `${databaseUrl}${databaseUrl.includes('?') ? '&' : '?'}pgbouncer=true`
  : undefined

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: { url },
  },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
