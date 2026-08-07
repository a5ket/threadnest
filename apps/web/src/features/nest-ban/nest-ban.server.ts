import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestBanListUrl } from '@/generated/api/nest-bans/nest-bans'
import { NestBan } from './nest-ban.types'

export async function getNestBansServer(nestSlug: string): Promise<NestBan[]> {
  try {
    return await apiClientServer<NestBan[]>(getNestBanListUrl(nestSlug))
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404)) {
      return []
    }

    throw error
  }
}
