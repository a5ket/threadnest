import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

// '' is a sentinel for anonymous viewers so an omitted filter can't match another user's vote row.
export function threadDetailsSelect(nestId: string, viewerId?: string) {
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
    deletedByPlatform: true,
    lockedAt: true,
    pinnedAt: true,

    commentCount: true,
    lastCommentAt: true,
    score: true,

    author: {
      select: {
        ...USER_REFERENCE_SELECT,
        nestMembership: { where: { nestId }, select: { role: true }, take: 1 }
      }
    },

    nest: { select: { name: true, slug: true } },

    threadVotes: { where: { userId: viewerId ?? '' }, select: { type: true }, take: 1 },
    savedBy: { where: { userId: viewerId ?? '' }, select: { threadId: true }, take: 1 },

    attachments: {
      select: { id: true, key: true, width: true, height: true, order: true },
      orderBy: { order: 'asc' }
    }
  } satisfies Prisma.ThreadSelect
}
