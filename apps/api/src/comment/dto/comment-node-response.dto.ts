import { ApiProperty } from '@nestjs/swagger'
import { VoteType } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

export class CommentNodeResponseDto {
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

  @ApiProperty({ description: 'Net vote score (upvotes minus downvotes)' })
  score!: number

  @ApiProperty({ enum: VoteType, description: 'The current user\'s vote on this comment, if any', nullable: true })
  viewerVote!: VoteType | null

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

  @ApiProperty({ description: 'Depth of this comment within the tree (0 for roots)' })
  depth!: number

  @ApiProperty({ description: 'Whether the current user has blocked the comment author' })
  viewerBlockedAuthor!: boolean

  @ApiProperty({ description: 'Whether the comment author has blocked the current user' })
  authorBlockedViewer!: boolean
}

export class CommentTreeMetaDto {
  @ApiProperty({ description: 'Total number of root comments (for listByThread) or replies (for listCommentReplies) matching the query' })
  total!: number

  @ApiProperty({ description: 'Page size that was requested' })
  limit!: number

  @ApiProperty({ description: 'Whether more root/reply pages are available' })
  hasMore!: boolean

  @ApiProperty({ description: 'Cursor to fetch the next page, or null if there are no more results', nullable: true, type: 'string' })
  nextCursor!: string | null
}
