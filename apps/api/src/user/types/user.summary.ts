import type { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from '../selects/user.reference.select'

export type UserSummary = Prisma.UserGetPayload<{
  select: typeof USER_REFERENCE_SELECT
}>
