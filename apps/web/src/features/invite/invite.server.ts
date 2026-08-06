import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestInviteListUrl } from '@/generated/api/nest-invites/nest-invites'
import { Invite } from './invite.types'

export async function getNestInvitesServer(nestSlug: string): Promise<Invite[]> {
  try {
    return await apiClientServer<Invite[]>(getNestInviteListUrl(nestSlug))
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404)) {
      return []
    }

    throw error
  }
}
