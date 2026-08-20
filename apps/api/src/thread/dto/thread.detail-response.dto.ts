import { ApiProperty } from '@nestjs/swagger'
import { VoteType } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'
import { ThreadAccessContextDto } from './thread.access-context.dto'
import { ThreadAttachmentResponseDto } from './thread-attachment-response.dto'

export class ThreadDetailResponseDto {
  @ApiProperty({ description: 'Thread ID' })
  id!: string

  @ApiProperty({ description: 'Unique thread slug (within its nest)' })
  slug!: string

  @ApiProperty({ description: 'Thread title' })
  title!: string

  @ApiProperty({ description: 'Thread content. Null if the current user cannot read it', nullable: true, type: 'string' })
  content!: string | null

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date

  @ApiProperty({ description: 'Timestamp of the last comment on this thread', nullable: true, type: 'string' })
  lastCommentAt!: Date | null

  @ApiProperty({ description: 'Number of comments on this thread' })
  commentCount!: number

  @ApiProperty({ description: 'Net vote score (upvotes minus downvotes)' })
  score!: number

  @ApiProperty({ enum: VoteType, description: 'The current user\'s vote on this thread, if any', nullable: true })
  viewerVote!: VoteType | null

  @ApiProperty({ description: 'Whether the current user has saved this thread' })
  viewerSaved!: boolean

  @ApiProperty({ description: 'Deletion timestamp, if the thread was deleted', nullable: true, type: 'string' })
  deletedAt!: Date | null

  @ApiProperty({ description: 'ID of the user who deleted the thread. Only present for nest moderators, and never set for platform-removed threads', required: false, nullable: true, type: 'string' })
  deletedById?: string | null

  @ApiProperty({ description: 'Whether the thread was removed by platform moderators rather than nest moderation. Only present for nest moderators', required: false })
  deletedByPlatform?: boolean

  @ApiProperty({ type: UserReferenceDto, description: 'Thread author' })
  author!: UserReferenceDto

  @ApiProperty({ description: 'When the thread was locked, if it is', nullable: true, type: 'string' })
  lockedAt!: Date | null

  @ApiProperty({ description: 'When the thread was pinned, if it is', nullable: true, type: 'string' })
  pinnedAt!: Date | null

  @ApiProperty({ type: ThreadAccessContextDto, description: 'The current user\'s access and permissions for this thread' })
  access!: ThreadAccessContextDto

  @ApiProperty({ type: [ThreadAttachmentResponseDto], description: 'Images attached to this thread, in display order' })
  attachments!: ThreadAttachmentResponseDto[]
}
