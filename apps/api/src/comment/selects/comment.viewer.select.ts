import { Prisma } from 'generated/prisma/client'
import { USER_REFERENCE_SELECT } from 'src/user/selects/user.reference.select'

export function commentViewerSelect(nestId: string, viewerId?: string) {
  return {
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
      select: {
        ...USER_REFERENCE_SELECT,
        nestMembership: { where: { nestId }, select: { role: true }, take: 1 }
      }
    },
    commentVotes: { where: { userId: viewerId ?? '' }, select: { type: true }, take: 1 }
  } satisfies Prisma.CommentSelect
}
