import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestGetBySlugUrl, getNestListUrl } from '@/generated/api/nests/nests'
import { NestList200Data, NestListSortBy } from '@/generated/api/models'
import { NestDetail, NestDiscoveryItem } from './nest.types'

export async function getNestServer(nestSlug: string): Promise<NestDetail | null> {
  try {
    return await apiClientServer<NestDetail>(getNestGetBySlugUrl(nestSlug))
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }

    throw error
  }
}

export interface NestListPage {
  items: NestDiscoveryItem[]
  nextCursor: string | null
}

export async function getNestsServer(sortBy: NestListSortBy = NestListSortBy.createdAt, search?: string): Promise<NestListPage> {
  const page = await apiClientServer<NestList200Data>(getNestListUrl({
    limit: 20,
    sortBy,
    sortAscending: false,
    search
  }))

  return { items: page.items, nextCursor: page.meta.nextCursor }
}
