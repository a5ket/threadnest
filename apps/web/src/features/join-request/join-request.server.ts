import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestJoinRequestListUrl } from '@/generated/api/nest-join-requests/nest-join-requests'
import { JoinRequest } from './join-request.types'

export async function getNestJoinRequestsServer(nestSlug: string): Promise<JoinRequest[]> {
  try {
    return await apiClientServer<JoinRequest[]>(getNestJoinRequestListUrl(nestSlug))
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404)) {
      return []
    }

    throw error
  }
}
