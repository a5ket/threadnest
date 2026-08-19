import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { PlatformActionType, PlatformReportStatus, PlatformReportTargetType, PlatformRole } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

class PlatformActionLogNestDto {
  @ApiProperty({ description: 'Nest ID' })
  id!: string

  @ApiProperty({ description: 'Nest slug' })
  slug!: string

  @ApiProperty({ description: 'Nest name' })
  name!: string
}

class RoleGrantedActionDataDto {
  @ApiProperty({ enum: ['ROLE_GRANTED'] })
  type!: 'ROLE_GRANTED'

  @ApiProperty({ enum: PlatformRole }) role!: PlatformRole
}

class RoleChangedActionDataDto {
  @ApiProperty({ enum: ['ROLE_CHANGED'] })
  type!: 'ROLE_CHANGED'

  @ApiProperty({ enum: PlatformRole }) newRole!: PlatformRole
}

class RoleRevokedActionDataDto {
  @ApiProperty({ enum: ['ROLE_REVOKED'] })
  type!: 'ROLE_REVOKED'
}

class UserSuspendedActionDataDto {
  @ApiProperty({ enum: ['USER_SUSPENDED'] })
  type!: 'USER_SUSPENDED'

  @ApiProperty() reason!: string
}

class UserUnsuspendedActionDataDto {
  @ApiProperty({ enum: ['USER_UNSUSPENDED'] })
  type!: 'USER_UNSUSPENDED'
}

class ThreadRemovedActionDataDto {
  @ApiProperty({ enum: ['THREAD_REMOVED'] })
  type!: 'THREAD_REMOVED'

  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
}

class CommentRemovedActionDataDto {
  @ApiProperty({ enum: ['COMMENT_REMOVED'] })
  type!: 'COMMENT_REMOVED'

  @ApiProperty() commentId!: string
  @ApiProperty() commentExcerpt!: string
  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
}

class ContentBulkRemovedActionDataDto {
  @ApiProperty({ enum: ['CONTENT_BULK_REMOVED'] })
  type!: 'CONTENT_BULK_REMOVED'

  @ApiProperty() threadsRemoved!: number
  @ApiProperty() commentsRemoved!: number
}

class ReportReviewedActionDataDto {
  @ApiProperty({ enum: ['REPORT_REVIEWED'] })
  type!: 'REPORT_REVIEWED'

  @ApiProperty() reportId!: string
  @ApiProperty({ enum: PlatformReportTargetType }) targetType!: PlatformReportTargetType
  @ApiProperty({ enum: [PlatformReportStatus.RESOLVED, PlatformReportStatus.DISMISSED] }) status!: Exclude<PlatformReportStatus, 'PENDING'>
}

const PLATFORM_ACTION_LOG_DATA_MODELS = [
  RoleGrantedActionDataDto,
  RoleChangedActionDataDto,
  RoleRevokedActionDataDto,
  UserSuspendedActionDataDto,
  UserUnsuspendedActionDataDto,
  ThreadRemovedActionDataDto,
  CommentRemovedActionDataDto,
  ContentBulkRemovedActionDataDto,
  ReportReviewedActionDataDto
] as const

@ApiExtraModels(...PLATFORM_ACTION_LOG_DATA_MODELS)
export class PlatformActionLogResponseDto {
  @ApiProperty({ description: 'Action log entry ID' })
  id!: string

  @ApiProperty({ enum: PlatformActionType, description: 'What kind of platform action this is' })
  type!: PlatformActionType

  @ApiProperty({ type: UserReferenceDto, description: 'Who performed the action' })
  actor!: UserReferenceDto

  @ApiProperty({ type: UserReferenceDto, nullable: true, description: 'Who the action was performed against, if applicable' })
  target!: UserReferenceDto | null

  @ApiProperty({ type: PlatformActionLogNestDto, nullable: true, description: 'The nest this action relates to, if applicable' })
  nest!: PlatformActionLogNestDto | null

  @ApiProperty({ description: 'When the action happened' })
  createdAt!: Date

  @ApiProperty({
    description: 'Type-specific context for this action — narrow on `data.type` to access the fields for that action type',
    oneOf: PLATFORM_ACTION_LOG_DATA_MODELS.map((model) => ({ $ref: getSchemaPath(model) }))
  })
  data!:
    | RoleGrantedActionDataDto
    | RoleChangedActionDataDto
    | RoleRevokedActionDataDto
    | UserSuspendedActionDataDto
    | UserUnsuspendedActionDataDto
    | ThreadRemovedActionDataDto
    | CommentRemovedActionDataDto
    | ContentBulkRemovedActionDataDto
    | ReportReviewedActionDataDto
}
