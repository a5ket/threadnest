import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/constants/user.reference.select'

export const THREAD_SUMMARY_SELECT = {
  id: true,

  title: true,
  slug: true,

  createdAt: true,
  updatedAt: true,
  lastCommentAt: true,

  commentCount: true,

  lockedAt: true,
  pinnedAt: true,

  author: {
    select: USER_REFERENCE_SELECT
  }
} satisfies Prisma.ThreadSelect