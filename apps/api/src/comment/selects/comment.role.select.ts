import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

// nestId-parameterized so the author's role in *this* nest can be joined in directly
export function commentRoleSelect(nestId: string) {
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
