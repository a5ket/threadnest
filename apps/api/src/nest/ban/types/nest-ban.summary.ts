import type { Prisma } from 'generated/prisma/client'
import { NEST_BAN_SUMMARY_SELECT } from '../constants/nest-ban.summary.select'

export type NestBanSummary = Prisma.NestBanGetPayload<{
  select: typeof NEST_BAN_SUMMARY_SELECT
}>
