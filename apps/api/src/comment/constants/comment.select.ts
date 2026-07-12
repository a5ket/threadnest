import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/constants/user.reference.select'

export const COMMENT_SELECT = {
  id: true,
  threadId: true,
  authorId: true,
  parentId: true,
  content: true,
  depth: true,
  replyCount: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  deletedAt: true,
  deletedById: true,
  author: {
    select: USER_REFERENCE_SELECT,
  },
} satisfies Prisma.CommentSelect
