import { Prisma } from 'generated/prisma/client'

export const CHAT_POLICY_SUBJECT_SELECT = {
  id: true,
  isGroup: true,
  participants: {
    select: {
      userId: true,
      archivedAt: true,
      clearedAt: true
    }
  }
} satisfies Prisma.ChatSelect
