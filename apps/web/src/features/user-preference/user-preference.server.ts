import { apiClientServer } from '@/common/server-api-client'
import { getMePreferenceGetUrl } from '@/generated/api/me/me'
import { UserPreference } from './user-preference.types'

export async function getPreferencesServer(): Promise<UserPreference> {
  return apiClientServer<UserPreference>(getMePreferenceGetUrl())
}
