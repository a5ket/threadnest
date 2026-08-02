import { ApiError, ApiNetworkError, ApiParseError, GenericApiErrorCode } from '@/common/api-error'
import { apiClientServer, checkHasSession } from '@/common/server-api-client'
import { getMeBootstrapUrl } from '@/generated/api/me/me'
import { BootstrapData, MeBootstrapResult } from './me.types'

export async function getMeServer(): Promise<MeBootstrapResult> {
  const hasSession = await checkHasSession()

  if (!hasSession) {
    return { status: 'signed-out' }
  }

  try {
    const data = await apiClientServer<BootstrapData>(getMeBootstrapUrl())
    return { status: 'signed-in', data }
  }
  catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) {
      return { status: 'signed-out' }
    }

    if (error instanceof ApiError || error instanceof ApiNetworkError || error instanceof ApiParseError) {
      console.error('Failed to load bootstrap data', error)
      return { status: 'error', error: { code: error.errorCode as GenericApiErrorCode, message: error.message } }
    }

    throw error
  }
}
