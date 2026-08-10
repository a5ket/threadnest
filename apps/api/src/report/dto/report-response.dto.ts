import { ApiProperty } from '@nestjs/swagger'
import { ReportReason, ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { UserSummaryResponseDto } from 'src/user/dto/user-summary-response.dto'

export class ReportedThreadDto {
  @ApiProperty({ description: 'Thread ID' })
  id!: string

  @ApiProperty({ description: 'Thread slug' })
  slug!: string

  @ApiProperty({ description: 'Thread title' })
  title!: string
}

export class ReportedCommentDto {
  @ApiProperty({ description: 'Comment ID' })
  id!: string

  @ApiProperty({ description: 'Comment content' })
  content!: string

  @ApiProperty({ description: 'Slug of the thread this comment belongs to' })
  threadSlug!: string

  @ApiProperty({ description: 'Title of the thread this comment belongs to' })
  threadTitle!: string
}

export class ReportResponseDto {
  @ApiProperty({ description: 'Report ID' })
  id!: string

  @ApiProperty({ enum: ReportTargetType, description: 'What kind of content this report targets' })
  targetType!: ReportTargetType

  @ApiProperty({ enum: ReportReason, description: 'Why the content was reported' })
  reason!: ReportReason

  @ApiProperty({ description: 'Additional details from the reporter', nullable: true, type: 'string' })
  details!: string | null

  @ApiProperty({ enum: ReportStatus, description: 'Current status of the report' })
  status!: ReportStatus

  @ApiProperty({ description: 'When the report was filed' })
  createdAt!: Date

  @ApiProperty({ description: 'When the report was resolved or dismissed', nullable: true, type: 'string' })
  resolvedAt!: Date | null

  @ApiProperty({ type: UserSummaryResponseDto, description: 'The user who filed the report' })
  reporter!: UserSummaryResponseDto

  @ApiProperty({ type: UserSummaryResponseDto, nullable: true, description: 'The moderator who resolved or dismissed the report' })
  resolvedBy!: UserSummaryResponseDto | null

  @ApiProperty({ type: ReportedThreadDto, nullable: true, description: 'Set when targetType is THREAD' })
  thread!: ReportedThreadDto | null

  @ApiProperty({ type: ReportedCommentDto, nullable: true, description: 'Set when targetType is COMMENT' })
  comment!: ReportedCommentDto | null
}
