import { PlatformActionLogResponseDto, PlatformActionLogResponseDtoType } from '@/generated/api/models'

export type PlatformActionLogEntry = PlatformActionLogResponseDto
export type PlatformActionType = PlatformActionLogResponseDtoType

export interface PlatformActionLogFilters {
  type?: PlatformActionType
  actorId?: string
  targetUserId?: string
  nestId?: string
  createdAfter?: string
  createdBefore?: string
}
