import { Prisma, PrismaClient } from 'generated/prisma/client'

export type Database = Prisma.TransactionClient | PrismaClient
