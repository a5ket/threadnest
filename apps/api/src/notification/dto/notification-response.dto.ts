import { ApiExtraModels, ApiProperty, getSchemaPath } from '@nestjs/swagger'
import { NotificationType, ReportTargetType } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

class ThreadReplyNotificationDataDto {
  @ApiProperty({ enum: ['THREAD_REPLY'] })
  type!: 'THREAD_REPLY'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty({ description: 'The new top-level comment' }) commentId!: string
  @ApiProperty() commentExcerpt!: string
}

class CommentReplyNotificationDataDto {
  @ApiProperty({ enum: ['COMMENT_REPLY'] })
  type!: 'COMMENT_REPLY'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty({ description: 'The new reply' }) commentId!: string
  @ApiProperty() commentExcerpt!: string
}

class JoinRequestApprovedNotificationDataDto {
  @ApiProperty({ enum: ['JOIN_REQUEST_APPROVED'] })
  type!: 'JOIN_REQUEST_APPROVED'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
}

class JoinRequestRejectedNotificationDataDto {
  @ApiProperty({ enum: ['JOIN_REQUEST_REJECTED'] })
  type!: 'JOIN_REQUEST_REJECTED'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
}

class NestInviteReceivedNotificationDataDto {
  @ApiProperty({ enum: ['NEST_INVITE_RECEIVED'] })
  type!: 'NEST_INVITE_RECEIVED'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
  @ApiProperty({ nullable: true, type: 'string' }) message!: string | null
}

class BannedFromNestNotificationDataDto {
  @ApiProperty({ enum: ['BANNED_FROM_NEST'] })
  type!: 'BANNED_FROM_NEST'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
  @ApiProperty({ nullable: true, type: 'string' }) reason!: string | null
}

class OwnershipTransferredNotificationDataDto {
  @ApiProperty({ enum: ['OWNERSHIP_TRANSFERRED'] })
  type!: 'OWNERSHIP_TRANSFERRED'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
}

class ReportResolvedNotificationDataDto {
  @ApiProperty({ enum: ['REPORT_RESOLVED'] })
  type!: 'REPORT_RESOLVED'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty({ enum: ['RESOLVED', 'DISMISSED'] }) status!: 'RESOLVED' | 'DISMISSED'
  @ApiProperty({ enum: ReportTargetType, description: 'What you reported — a thread, or a comment within it' }) targetType!: ReportTargetType
  @ApiProperty({ nullable: true, type: 'string', description: 'Set when targetType is COMMENT' }) commentId!: string | null
}

class ContentRemovedNotificationDataDto {
  @ApiProperty({ enum: ['CONTENT_REMOVED'] })
  type!: 'CONTENT_REMOVED'

  @ApiProperty() nestSlug!: string
  @ApiProperty() nestName!: string
  @ApiProperty() threadSlug!: string
  @ApiProperty() threadTitle!: string
  @ApiProperty({ enum: ReportTargetType, description: 'Whether the thread itself or a comment within it was removed' }) targetType!: ReportTargetType
  @ApiProperty({ nullable: true, type: 'string', description: 'Set when targetType is COMMENT' }) commentId!: string | null
  @ApiProperty({ nullable: true, type: 'string', description: 'Set when targetType is COMMENT' }) commentExcerpt!: string | null
}

const NOTIFICATION_DATA_MODELS = [
  ThreadReplyNotificationDataDto,
  CommentReplyNotificationDataDto,
  JoinRequestApprovedNotificationDataDto,
  JoinRequestRejectedNotificationDataDto,
  NestInviteReceivedNotificationDataDto,
  BannedFromNestNotificationDataDto,
  OwnershipTransferredNotificationDataDto,
  ReportResolvedNotificationDataDto,
  ContentRemovedNotificationDataDto,
] as const

@ApiExtraModels(...NOTIFICATION_DATA_MODELS)
export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id!: string

  @ApiProperty({ enum: NotificationType, description: 'What kind of notification this is' })
  type!: NotificationType

  @ApiProperty({ type: UserReferenceDto, nullable: true, description: 'Who triggered this notification. Null once the actor\'s account is deleted' })
  actor!: UserReferenceDto | null

  @ApiProperty({ description: 'When the notification was created' })
  createdAt!: Date

  @ApiProperty({ description: 'When the notification was read, if it has been', nullable: true, type: 'string' })
  readAt!: Date | null

  @ApiProperty({
    description: 'Type-specific context for this notification — narrow on `data.type` to access the fields for that notification type',
    oneOf: NOTIFICATION_DATA_MODELS.map((model) => ({ $ref: getSchemaPath(model) })),
  })
  data!:
    | ThreadReplyNotificationDataDto
    | CommentReplyNotificationDataDto
    | JoinRequestApprovedNotificationDataDto
    | JoinRequestRejectedNotificationDataDto
    | NestInviteReceivedNotificationDataDto
    | BannedFromNestNotificationDataDto
    | OwnershipTransferredNotificationDataDto
    | ReportResolvedNotificationDataDto
    | ContentRemovedNotificationDataDto
}
