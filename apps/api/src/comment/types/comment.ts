import type { NestMemberRole } from 'generated/prisma/enums'
import type { Prisma } from 'generated/prisma/client'
import type { COMMENT_SELECT } from '../selects/comment.select'
import type { commentRoleSelect } from '../selects/comment.role.select'

export type Comment = Prisma.CommentGetPayload<{ select: typeof COMMENT_SELECT }>
export type CommentWithRole = Prisma.CommentGetPayload<{ select: ReturnType<typeof commentRoleSelect> }>

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
    authorRole: NestMemberRole | null
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
    items: CommentNode[]
    meta: {
        total: number
        limit: number
        hasMore: boolean
        nextCursor: string | null
    }
}
