import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestThreadGetBySlugUrl, getNestThreadListUrl } from '@/generated/api/threads/threads'
import { NestThreadList200Data, NestThreadListSortBy } from '@/generated/api/models'
import { ThreadDetail, ThreadSummary } from './thread.types'

export async function getThreadServer(nestSlug: string, threadSlug: string): Promise<ThreadDetail | null> {
  try {
    return await apiClientServer<ThreadDetail>(getNestThreadGetBySlugUrl(nestSlug, threadSlug))
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }

    throw error
  }
}

export interface ThreadListPage {
  items: ThreadSummary[]
  nextCursor: string | null
}

export async function getThreadsServer(nestSlug: string, sortBy: NestThreadListSortBy = NestThreadListSortBy.createdAt): Promise<ThreadListPage> {
  try {
    const page = await apiClientServer<NestThreadList200Data>(getNestThreadListUrl(nestSlug, {
      limit: 20,
      sortBy,
      sortAscending: false
    }))

    return { items: page.items, nextCursor: page.meta.nextCursor }
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return { items: [], nextCursor: null }
    }

    throw error
  }
}
