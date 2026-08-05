import { ApiProperty } from '@nestjs/swagger'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

export class ThreadSummaryResponseDto {
  @ApiProperty({ description: 'Thread ID' })
  id!: string

  @ApiProperty({ description: 'Unique thread slug (within its nest)' })
  slug!: string

  @ApiProperty({ description: 'Thread title' })
  title!: string

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date

  @ApiProperty({ description: 'Timestamp of the last comment on this thread', nullable: true, type: 'string' })
  lastCommentAt!: Date | null

  @ApiProperty({ description: 'Number of comments on this thread' })
  commentCount!: number

  @ApiProperty({ description: 'When the thread was locked, if it is', nullable: true, type: 'string' })
  lockedAt!: Date | null

  @ApiProperty({ description: 'When the thread was pinned, if it is', nullable: true, type: 'string' })
  pinnedAt!: Date | null

  @ApiProperty({ type: UserReferenceDto, description: 'Thread author' })
  author!: UserReferenceDto
}
