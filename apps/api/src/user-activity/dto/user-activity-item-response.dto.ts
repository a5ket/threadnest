import { ApiProperty } from '@nestjs/swagger'
import { CommentAuthorItemResponseDto } from 'src/comment/dto/comment-author-item-response.dto'
import { ThreadSearchResponseDto } from 'src/thread/dto/thread-search-response.dto'

export const UserActivityItemType = {
  THREAD: 'THREAD',
  COMMENT: 'COMMENT'
} as const

export type UserActivityItemType = typeof UserActivityItemType[keyof typeof UserActivityItemType]

export class UserActivityItemResponseDto {
  @ApiProperty({ enum: UserActivityItemType, description: 'Whether this entry is a thread or a comment' })
  type!: UserActivityItemType

  @ApiProperty({ type: ThreadSearchResponseDto, required: false, description: 'Present when type is THREAD' })
  thread?: ThreadSearchResponseDto

  @ApiProperty({ type: CommentAuthorItemResponseDto, required: false, description: 'Present when type is COMMENT' })
  comment?: CommentAuthorItemResponseDto
}
