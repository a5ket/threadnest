import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export const NOTIFICATION_SELECT = {
  id: true,
  type: true,
  data: true,
  readAt: true,
  createdAt: true,
  actor: { select: USER_REFERENCE_SELECT },
} satisfies Prisma.NotificationSelect
