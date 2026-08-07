import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

// nestId-parameterized so the author's role in *this* nest can be joined in directly
export function threadSummarySelect(nestId: string) {
  return {
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
      select: {
        ...USER_REFERENCE_SELECT,
        nestMembership: { where: { nestId }, select: { role: true }, take: 1 }
      }
    }
  } satisfies Prisma.ThreadSelect
}
