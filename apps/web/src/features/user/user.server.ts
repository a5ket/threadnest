import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getUserGetByUsernameUrl } from '@/generated/api/users/users'
import { UserProfileResponseDto } from '@/generated/api/models'

export async function getUserProfileServer(username: string): Promise<UserProfileResponseDto | null> {
  try {
    return await apiClientServer<UserProfileResponseDto>(getUserGetByUsernameUrl(username))
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 404) {
      return null
    }

    throw error
  }
}
