import type { Prisma } from 'generated/prisma/client'
import type { COMMENT_SELECT } from '../constants/comment.select'

export type Comment = Prisma.CommentGetPayload<{ select: typeof COMMENT_SELECT }>

export type CommentSortBy = 'createdAt' | 'updatedAt'

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
    parentId: string | null
    content: string
    replyCount: number
    createdAt: Date
    updatedAt: Date
    editedAt: Date | null
    deletedAt: Date | null
    deletedById: string | null
    depth: number
} & CommentBlockFlags

export type CommentPage = {
    data: CommentNode[]
    meta: {
        total: number
        limit: number
        hasNextPage: boolean
        nextCursor: string | null
    }
}
