import { ApiError } from '@/common/api-error'
import { apiClientServer } from '@/common/server-api-client'
import { getNestSettingsGetUrl } from '@/generated/api/nest-settings/nest-settings'
import { NestSettings } from './nest-settings.types'

export async function getNestSettingsServer(nestSlug: string): Promise<NestSettings | null> {
  try {
    return await apiClientServer<NestSettings>(getNestSettingsGetUrl(nestSlug))
  }
  catch (error) {
    if (error instanceof ApiError && (error.statusCode === 404 || error.statusCode === 403)) {
      return null
    }

    throw error
  }
}
