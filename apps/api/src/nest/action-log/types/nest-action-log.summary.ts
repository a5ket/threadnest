import { Prisma } from 'generated/prisma/client'
import { NEST_ACTION_LOG_SELECT } from '../selects/nest-action-log.select'

export type NestActionLogSummary = Prisma.NestActionLogGetPayload<{
  select: typeof NEST_ACTION_LOG_SELECT
}>
