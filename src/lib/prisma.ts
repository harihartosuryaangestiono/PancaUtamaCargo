import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// In development, ensure global instance has the latest generated models (e.g. tripContract, driver)
const existingPrisma = globalForPrisma.prisma
const isInstanceUpToDate = existingPrisma && (existingPrisma as any).tripContract && (existingPrisma as any).driver

export const prisma =
  isInstanceUpToDate
    ? existingPrisma
    : new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

