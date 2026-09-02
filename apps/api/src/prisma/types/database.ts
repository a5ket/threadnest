import { Prisma, PrismaClient } from 'generated/prisma/client'

/**
 * Either the standalone Prisma client or a transaction client — the type used throughout the
 * repository layer for the optional `db` parameter, so a repository method can run standalone or
 * participate in a caller's transaction with the same code path.
 */
export type Database = Prisma.TransactionClient | PrismaClient
