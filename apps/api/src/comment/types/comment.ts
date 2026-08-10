import type { NestMemberRole, VoteType } from 'generated/prisma/enums'
import type { Prisma } from 'generated/prisma/client'
import type { COMMENT_SELECT } from '../selects/comment.select'
import type { commentViewerSelect } from '../selects/comment.viewer.select'

export type Comment = Prisma.CommentGetPayload<{ select: typeof COMMENT_SELECT }>

export type CommentViewerSelectResult = Prisma.CommentGetPayload<{ select: ReturnType<typeof commentViewerSelect> }>
export type CommentWithRole = Omit<CommentViewerSelectResult, 'commentVotes'> & { viewerVote: VoteType | null }

export type CommentSortBy = 'createdAt' | 'updatedAt' | 'score'

export type CommentTreeOptions = {
    maxDepth: number
    replyLimit: number
    sortBy: CommentSortBy
    sortAscending: boolean
    limit: number
    cursor?: string | null
}

export type CommentBlockFlags = {
    viewerBlockedAuthor: boolean
    authorBlockedViewer: boolean
}

export type CommentNode = {
    id: string
    threadId: string
    authorId: string
    authorUsername: string | null
    authorDisplayName: string | null
    authorAvatarUrl: string | null
    authorRole: NestMemberRole | null
    parentId: string | null
    content: string
    replyCount: number
    score: number
    viewerVote: VoteType | null
    createdAt: Date
    updatedAt: Date
    editedAt: Date | null
    deletedAt: Date | null
    deletedById: string | null
    depth: number
} & CommentBlockFlags

export type CommentPage = {
    items: CommentNode[]
    meta: {
        total: number
        limit: number
        hasMore: boolean
        nextCursor: string | null
    }
}
