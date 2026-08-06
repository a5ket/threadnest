import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/constants/user.reference.select'

// Internal-shape select (no author role) — used only where nestId isn't known ahead
// of the query and the result isn't rendered with role info.
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

// nestId-parameterized so the author's role in *this* nest can be joined in directly
export function commentSelect(nestId: string) {
  return {
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
      select: {
        ...USER_REFERENCE_SELECT,
        nestMembership: { where: { nestId }, select: { role: true }, take: 1 }
      }
    },
  } satisfies Prisma.CommentSelect
}
