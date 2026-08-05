import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestGetBySlugUrl } from '@/generated/api/nests/nests'
import { NestDetail } from './nest.types'

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
