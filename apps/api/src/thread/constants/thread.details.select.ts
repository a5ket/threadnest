import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/constants/user.reference.select'

export const THREAD_DETAILS_SELECT = {
  id: true,
  nestId: true,
  authorId: true,

  title: true,
  slug: true,
  content: true,

  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  deletedById: true,
  lockedAt: true,
  pinnedAt: true,

  commentCount: true,
  lastCommentAt: true,

  author: {
    select: USER_REFERENCE_SELECT,
  },
} satisfies Prisma.ThreadSelect
