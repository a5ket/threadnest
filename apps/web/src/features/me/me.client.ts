import { apiClient } from '@/common/api-client'
import { getMeBootstrapUrl } from '@/generated/api/me/me'
import { BootstrapData } from './me.types'

export function getMeClient() {
  return apiClient<BootstrapData>(getMeBootstrapUrl())
}
