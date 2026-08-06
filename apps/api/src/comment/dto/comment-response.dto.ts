import { ApiProperty } from '@nestjs/swagger'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

export class CommentResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id!: string

  @ApiProperty({ description: 'ID of the thread this comment belongs to' })
  threadId!: string

  @ApiProperty({ type: UserReferenceDto, nullable: true, description: 'Comment author. Null if hidden (e.g. deleted by author, or a block applies)' })
  author!: UserReferenceDto | null

  @ApiProperty({ description: 'ID of the parent comment, if this is a reply', nullable: true, type: 'string' })
  parentId!: string | null

  @ApiProperty({ description: 'Comment content. Null if hidden', nullable: true, type: 'string' })
  content!: string | null

  @ApiProperty({ description: 'Number of direct replies to this comment' })
  replyCount!: number

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date

  @ApiProperty({ description: 'When the comment was last edited, if it was', nullable: true, type: 'string' })
  editedAt!: Date | null

  @ApiProperty({ description: 'Deletion timestamp, if the comment was deleted', nullable: true, type: 'string' })
  deletedAt!: Date | null

  @ApiProperty({ description: 'ID of the user who deleted the comment, if it was deleted', nullable: true, type: 'string' })
  deletedById!: string | null

  @ApiProperty({ description: 'Whether the current user has blocked the comment author' })
  viewerBlockedAuthor!: boolean

  @ApiProperty({ description: 'Whether the comment author has blocked the current user' })
  authorBlockedViewer!: boolean
}
