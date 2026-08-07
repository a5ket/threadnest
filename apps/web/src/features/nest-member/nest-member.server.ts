import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { NestMemberList200Data } from '@/generated/api/models'
import { getNestMemberListUrl } from '@/generated/api/nest-members/nest-members'
import { NestMember } from './nest-member.types'

export async function getNestMembersServer(nestSlug: string): Promise<NestMember[]> {
  try {
    const page = await apiClientServer<NestMemberList200Data>(getNestMemberListUrl(nestSlug, { limit: 100 }))

    return page.items
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 403 || error.statusCode === 404)) {
      return []
    }

    throw error
  }
}
