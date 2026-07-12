import { Prisma } from 'generated/prisma/client'
import { BLOCKED_USER_SELECT } from '../constants/blocked.user.select'

export type BlockedUser = Prisma.UserBlockGetPayload<{
  select: typeof BLOCKED_USER_SELECT
}>