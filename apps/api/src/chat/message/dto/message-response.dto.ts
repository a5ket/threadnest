import { ApiProperty } from '@nestjs/swagger'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'
import { MessageReplyPreviewDto } from './message-reply-preview.dto'

export class MessageResponseDto {
  @ApiProperty({ description: 'Message ID' })
  id!: string

  @ApiProperty({ description: 'Chat ID' })
  chatId!: string

  @ApiProperty({ description: 'Message content. Null if the message was deleted', nullable: true, type: 'string' })
  content!: string | null

  @ApiProperty({ type: UserReferenceDto, description: 'The user who sent this message' })
  sender!: UserReferenceDto

  @ApiProperty({ type: MessageReplyPreviewDto, nullable: true, description: 'The message this one is replying to, if any' })
  replyTo!: MessageReplyPreviewDto | null

  @ApiProperty({ description: 'Deletion timestamp, if the message was deleted', nullable: true, type: 'string' })
  deletedAt!: Date | null

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date
}
