import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

// '' is a sentinel for anonymous viewers so an omitted filter can't match another user's vote row.
export function threadSummarySelect(nestId: string, viewerId?: string) {
  return {
    id: true,

    title: true,
    slug: true,

    createdAt: true,
    updatedAt: true,
    lastCommentAt: true,

    commentCount: true,
    score: true,

    lockedAt: true,
    pinnedAt: true,

    author: {
      select: {
        ...USER_REFERENCE_SELECT,
        nestMembership: { where: { nestId }, select: { role: true }, take: 1 }
      }
    },

    threadVotes: { where: { userId: viewerId ?? '' }, select: { type: true }, take: 1 },
    savedBy: { where: { userId: viewerId ?? '' }, select: { threadId: true }, take: 1 }
  } satisfies Prisma.ThreadSelect
}
