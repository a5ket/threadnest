import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export function chatSummarySelect() {
  return {
    id: true,
    isGroup: true,
    createdAt: true,
    lastMessageAt: true,

    participants: {
      select: {
        userId: true,
        lastReadAt: true,
        archivedAt: true,
        clearedAt: true,
        user: { select: USER_REFERENCE_SELECT }
      }
    },

    messages: {
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { id: true, content: true, senderId: true, createdAt: true, deletedAt: true }
    }
  } satisfies Prisma.ChatSelect
}
