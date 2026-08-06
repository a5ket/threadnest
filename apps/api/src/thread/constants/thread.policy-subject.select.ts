import { Prisma } from 'generated/prisma/client'

export const THREAD_POLICY_SUBJECT_SELECT = {
  id: true,
  nestId: true,
  authorId: true,
  createdAt: true,
  deletedAt: true,
  deletedById: true,
  lockedAt: true,
  pinnedAt: true
} satisfies Prisma.ThreadSelect
