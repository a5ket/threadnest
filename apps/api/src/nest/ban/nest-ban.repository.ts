import { Prisma } from 'generated/prisma/client'
import { Database } from 'src/prisma/types/database'
import { NEST_BAN_SUMMARY_SELECT } from './selects/nest-ban.summary.select'

export type NestBan = Prisma.NestBanGetPayload<Record<string, never>>
export type NestBanSummary = Prisma.NestBanGetPayload<{ select: typeof NEST_BAN_SUMMARY_SELECT }>

/** Persistence contract for nest bans. */
export abstract class NestBanRepository {
  abstract findByNestIdAndUserId(nestId: string, userId: string): Promise<NestBan | null>
  abstract existsActive(nestId: string, userId: string): Promise<boolean>
  abstract create(nestId: string, userId: string, bannedById: string, db?: Database): Promise<NestBanSummary>
  abstract revoke(nestId: string, userId: string, revokedById: string, db?: Database): Promise<void>
  abstract listSummaryByNestId(nestId: string): Promise<NestBanSummary[]>
}
