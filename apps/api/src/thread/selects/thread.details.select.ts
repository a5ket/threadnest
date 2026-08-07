import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

// nestId-parameterized so the author's role in *this* nest can be joined in directly
export function threadDetailsSelect(nestId: string) {
  return {
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
      select: {
        ...USER_REFERENCE_SELECT,
        nestMembership: { where: { nestId }, select: { role: true }, take: 1 }
      }
    }
  } satisfies Prisma.ThreadSelect
}
