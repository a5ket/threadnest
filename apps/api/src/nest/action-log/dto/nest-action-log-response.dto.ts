import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { NestActionType, NestMemberRole, ReportTargetType } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

class MemberRoleChangedActionDataDto {
  @ApiProperty({ enum: ['MEMBER_ROLE_CHANGED'] })
  type!: 'MEMBER_ROLE_CHANGED'

  @ApiProperty({ enum: NestMemberRole }) newRole!: NestMemberRole
}

class MemberBannedActionDataDto {
  @ApiProperty({ enum: ['MEMBER_BANNED'] })
  type!: 'MEMBER_BANNED'

  @ApiProperty({ nullable: true, type: 'string' }) reason!: string | null
}

class MemberUnbannedActionDataDto {
  @ApiProperty({ enum: ['MEMBER_UNBANNED'] })
  type!: 'MEMBER_UNBANNED'
}

class MemberRemovedActionDataDto {
  @ApiProperty({ enum: ['MEMBER_REMOVED'] })
  type!: 'MEMBER_REMOVED'
}

class JoinRequestApprovedActionDataDto {
  @ApiProperty({ enum: ['JOIN_REQUEST_APPROVED'] })
  type!: 'JOIN_REQUEST_APPROVED'
}

class JoinRequestRejectedActionDataDto {
  @ApiProperty({ enum: ['JOIN_REQUEST_REJECTED'] })
  type!: 'JOIN_REQUEST_REJECTED'
}

class ThreadRemovedActionDataDto {
  @ApiProperty({ enum: ['THREAD_REMOVED'] })
  type!: 'THREAD_REMOVED'

  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
}

class CommentRemovedActionDataDto {
  @ApiProperty({ enum: ['COMMENT_REMOVED'] })
  type!: 'COMMENT_REMOVED'

  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty() commentId!: string
  @ApiProperty() commentExcerpt!: string
}

class ReportResolvedActionDataDto {
  @ApiProperty({ enum: ['REPORT_RESOLVED'] })
  type!: 'REPORT_RESOLVED'

  @ApiProperty() reportId!: string
  @ApiProperty({ enum: ['RESOLVED', 'DISMISSED'] }) status!: 'RESOLVED' | 'DISMISSED'
  @ApiProperty({ enum: ReportTargetType }) targetType!: ReportTargetType
  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty({ nullable: true, type: 'string' }) commentId!: string | null
}

class SettingsUpdatedActionDataDto {
  @ApiProperty({ enum: ['SETTINGS_UPDATED'] })
  type!: 'SETTINGS_UPDATED'
}

class OwnershipTransferredActionDataDto {
  @ApiProperty({ enum: ['OWNERSHIP_TRANSFERRED'] })
  type!: 'OWNERSHIP_TRANSFERRED'
}

const NEST_ACTION_LOG_DATA_MODELS = [
  MemberRoleChangedActionDataDto,
  MemberBannedActionDataDto,
  MemberUnbannedActionDataDto,
  MemberRemovedActionDataDto,
  JoinRequestApprovedActionDataDto,
  JoinRequestRejectedActionDataDto,
  ThreadRemovedActionDataDto,
  CommentRemovedActionDataDto,
  ReportResolvedActionDataDto,
  SettingsUpdatedActionDataDto,
  OwnershipTransferredActionDataDto
] as const

@ApiExtraModels(...NEST_ACTION_LOG_DATA_MODELS)
export class NestActionLogResponseDto {
  @ApiProperty({ description: 'Action log entry ID' })
  id!: string

  @ApiProperty({ enum: NestActionType, description: 'What kind of action this is' })
  type!: NestActionType

  @ApiProperty({ type: UserReferenceDto, description: 'Who performed the action' })
  actor!: UserReferenceDto

  @ApiProperty({ type: UserReferenceDto, nullable: true, description: 'Who the action was performed against, if applicable' })
  target!: UserReferenceDto | null

  @ApiProperty({ description: 'When the action happened' })
  createdAt!: Date

  @ApiProperty({
    description: 'Type-specific context for this action — narrow on `data.type` to access the fields for that action type',
    oneOf: NEST_ACTION_LOG_DATA_MODELS.map((model) => ({ $ref: getSchemaPath(model) }))
  })
  data!:
    | MemberRoleChangedActionDataDto
    | MemberBannedActionDataDto
    | MemberUnbannedActionDataDto
    | MemberRemovedActionDataDto
    | JoinRequestApprovedActionDataDto
    | JoinRequestRejectedActionDataDto
    | ThreadRemovedActionDataDto
    | CommentRemovedActionDataDto
    | ReportResolvedActionDataDto
    | SettingsUpdatedActionDataDto
    | OwnershipTransferredActionDataDto
}
