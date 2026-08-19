import { Prisma } from 'generated/prisma/client'
import { PLATFORM_ACTION_LOG_SELECT } from '../selects/platform-action-log.select'

export type PlatformActionLogSummary = Prisma.PlatformActionLogGetPayload<{
  select: typeof PLATFORM_ACTION_LOG_SELECT
}>
