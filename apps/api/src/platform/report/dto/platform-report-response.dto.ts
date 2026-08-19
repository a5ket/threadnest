import { ApiProperty } from '@nestjs/swagger'
import { PlatformReportReason, PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { UserSummaryResponseDto } from 'src/user/dto/user-summary-response.dto'

export class PlatformReportedNestDto {
  @ApiProperty({ description: 'Nest ID' })
  id!: string

  @ApiProperty({ description: 'Nest slug' })
  slug!: string

  @ApiProperty({ description: 'Nest name' })
  name!: string
}

export class PlatformReportedThreadDto {
  @ApiProperty({ description: 'Thread ID' })
  id!: string

  @ApiProperty({ description: 'Thread slug' })
  slug!: string

  @ApiProperty({ description: 'Thread title' })
  title!: string
}

export class PlatformReportedCommentDto {
  @ApiProperty({ description: 'Comment ID' })
  id!: string

  @ApiProperty({ description: 'Comment content' })
  content!: string

  @ApiProperty({ description: 'Slug of the thread this comment belongs to' })
  threadSlug!: string

  @ApiProperty({ description: 'Title of the thread this comment belongs to' })
  threadTitle!: string
}

export class PlatformReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id!: string

  @ApiProperty({ enum: PlatformReportTargetType, description: 'What kind of content or user this report targets' })
  targetType!: PlatformReportTargetType

  @ApiProperty({ enum: PlatformReportReason, description: 'Why this was reported' })
  reason!: PlatformReportReason

  @ApiProperty({ description: 'Additional details from the reporter', nullable: true, type: 'string' })
  details!: string | null

  @ApiProperty({ enum: PlatformReportStatus, description: 'Current status of the report' })
  status!: PlatformReportStatus

  @ApiProperty({ description: 'When the report was filed' })
  createdAt!: Date

  @ApiProperty({ description: 'When the report was resolved or dismissed', nullable: true, type: 'string' })
  resolvedAt!: Date | null

  @ApiProperty({ type: UserSummaryResponseDto, description: 'The user who filed the report' })
  reporter!: UserSummaryResponseDto

  @ApiProperty({ type: UserSummaryResponseDto, nullable: true, description: 'The admin or moderator who resolved or dismissed the report' })
  resolvedBy!: UserSummaryResponseDto | null

  @ApiProperty({ type: PlatformReportedNestDto, nullable: true, description: 'Set when targetType is NEST' })
  nest!: PlatformReportedNestDto | null

  @ApiProperty({ type: UserSummaryResponseDto, nullable: true, description: 'Set when targetType is USER' })
  targetUser!: UserSummaryResponseDto | null

  @ApiProperty({ type: PlatformReportedThreadDto, nullable: true, description: 'Set when targetType is THREAD' })
  thread!: PlatformReportedThreadDto | null

  @ApiProperty({ type: PlatformReportedCommentDto, nullable: true, description: 'Set when targetType is COMMENT' })
  comment!: PlatformReportedCommentDto | null
}
