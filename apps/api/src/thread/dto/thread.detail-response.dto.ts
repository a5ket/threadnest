import { ApiProperty } from '@nestjs/swagger'
import { VoteType } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'
import { ThreadAccessContextDto } from './thread.access-context.dto'

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

  @ApiProperty({ description: 'Deletion timestamp. Only present when the current user can delete the thread', required: false, nullable: true, type: 'string' })
  deletedAt?: Date | null

  @ApiProperty({ description: 'ID of the user who deleted the thread. Only present when the current user can delete the thread', required: false, nullable: true, type: 'string' })
  deletedById?: string | null

  @ApiProperty({ type: UserReferenceDto, description: 'Thread author' })
  author!: UserReferenceDto

  @ApiProperty({ description: 'When the thread was locked, if it is', nullable: true, type: 'string' })
  lockedAt!: Date | null

  @ApiProperty({ description: 'When the thread was pinned, if it is', nullable: true, type: 'string' })
  pinnedAt!: Date | null

  @ApiProperty({ type: ThreadAccessContextDto, description: 'The current user\'s access and permissions for this thread' })
  access!: ThreadAccessContextDto
}
