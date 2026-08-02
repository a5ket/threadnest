import type { GenericApiErrorCode } from '@/common/api-error'
import { MeBootstrapDataDto } from '@/generated/api/models'

export type BootstrapData = MeBootstrapDataDto

export interface MeBootstrapError {
  code: GenericApiErrorCode
  message: string
}

export type MeBootstrapResult
  = | { status: 'signed-in', data: BootstrapData }
    | { status: 'signed-out' }
    | { status: 'error', error: MeBootstrapError }
