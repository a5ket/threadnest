import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export const PLATFORM_ACTION_LOG_SELECT = {
  id: true,
  type: true,
  data: true,
  createdAt: true,
  actor: { select: USER_REFERENCE_SELECT },
  target: { select: USER_REFERENCE_SELECT },
  nest: { select: { id: true, slug: true, name: true } }
} satisfies Prisma.PlatformActionLogSelect
