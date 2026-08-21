import { ApiProperty } from '@nestjs/swagger'
import { CommentAttachmentResponseDto } from 'src/comment/dto/comment-attachment-response.dto'
import { NestReferencetDto } from 'src/nest/dto/nest-reference.dto'

export class CommentAuthorThreadReferenceDto {
  @ApiProperty({ description: 'Thread title' })
  title!: string

  @ApiProperty({ description: 'Thread slug' })
  slug!: string
}

export class CommentAuthorItemResponseDto {
  @ApiProperty({ description: 'Comment ID' })
  id!: string

  @ApiProperty({ description: 'Comment content' })
  content!: string

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ type: CommentAuthorThreadReferenceDto, description: 'The thread this comment was posted in' })
  thread!: CommentAuthorThreadReferenceDto

  @ApiProperty({ type: NestReferencetDto, description: 'The nest this comment belongs to' })
  nest!: NestReferencetDto

  @ApiProperty({ type: CommentAttachmentResponseDto, nullable: true, description: 'The comment\'s attachment, if it has one' })
  attachment!: CommentAttachmentResponseDto | null
}
