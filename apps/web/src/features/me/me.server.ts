import { apiClientServer } from '@/common/server-api-client'
import { ApiError } from '@/common/api-error'
import { getMeBootstrapUrl } from '@/generated/api/me/me'
import { headers } from 'next/headers'
import { BootstrapData } from './me.types'

export async function getMeServer(): Promise<BootstrapData | null> {
  const hasSession = (await headers()).get('x-has-session') === 'true'

  if (!hasSession) {
    return null
  }

  try {
    return await apiClientServer<BootstrapData>(getMeBootstrapUrl())
  }
  catch (error) {
    if (error instanceof ApiError) {
      return null
    }

    throw error
  }
}
