import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export const NEST_BAN_SUMMARY_SELECT = {
  reason: true,
  createdAt: true,
  user: { select: USER_REFERENCE_SELECT },
  bannedBy: { select: USER_REFERENCE_SELECT }
} satisfies Prisma.NestBanSelect