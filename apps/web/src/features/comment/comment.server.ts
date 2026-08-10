import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getCommentGetUrl, getCommentListRepliesUrl, getNestThreadCommentListUrl } from '@/generated/api/comments/comments'
import { CommentListReplies200Data, CommentListRepliesSortBy, NestThreadCommentList200Data, NestThreadCommentListSortBy } from '@/generated/api/models'
import { CommentDetail, CommentTreePage } from './comment.types'

const TREE_PARAMS = {
  limit: 20,
  replyLimit: 5,
  maxDepth: 3,
  sortAscending: true
} as const

const EMPTY_PAGE: CommentTreePage = { items: [], meta: { total: 0, limit: TREE_PARAMS.limit, hasMore: false, nextCursor: null } }

export async function getCommentTreeServer(
  nestSlug: string,
  threadSlug: string,
  sortBy: NestThreadCommentListSortBy = NestThreadCommentListSortBy.createdAt
): Promise<CommentTreePage> {
  try {
    return await apiClientServer<NestThreadCommentList200Data>(getNestThreadCommentListUrl(nestSlug, threadSlug, {
      ...TREE_PARAMS,
      sortBy,
      sortAscending: sortBy === NestThreadCommentListSortBy.score ? false : TREE_PARAMS.sortAscending
    }))
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return EMPTY_PAGE
    throw error
  }
}

export async function getCommentServer(commentId: string): Promise<CommentDetail | null> {
  try {
    return await apiClientServer<CommentDetail>(getCommentGetUrl(commentId))
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return null
    throw error
  }
}

export async function getCommentRepliesServer(commentId: string): Promise<CommentTreePage> {
  try {
    return await apiClientServer<CommentListReplies200Data>(getCommentListRepliesUrl(commentId, {
      ...TREE_PARAMS,
      sortBy: CommentListRepliesSortBy.createdAt
    }))
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) return EMPTY_PAGE
    throw error
  }
}
