import { Prisma } from 'generated/prisma/client'
import { NOTIFICATION_SELECT } from '../selects/notification.select'

export type NotificationSummary = Prisma.NotificationGetPayload<{
  select: typeof NOTIFICATION_SELECT
}>
