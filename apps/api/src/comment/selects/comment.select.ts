import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

// Used only where nestId isn't known ahead of the query and the result isn't rendered with role info.
export const COMMENT_SELECT = {
  id: true,
  threadId: true,
  authorId: true,
  parentId: true,
  content: true,
  depth: true,
  replyCount: true,
  score: true,
  createdAt: true,
  updatedAt: true,
  editedAt: true,
  deletedAt: true,
  deletedById: true,
  deletedByPlatform: true,
  attachments: {
    select: { id: true, key: true, width: true, height: true, order: true },
    orderBy: { order: 'asc' }
  },
  author: {
    select: USER_REFERENCE_SELECT,
  },
} satisfies Prisma.CommentSelect
