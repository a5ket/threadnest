import { ApiProperty } from '@nestjs/swagger'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'
import { ChatMessagePreviewDto } from './chat-message-preview.dto'

export class ChatSummaryResponseDto {
  @ApiProperty({ description: 'Chat ID' })
  id!: string

  @ApiProperty({ type: UserReferenceDto, nullable: true, description: 'The other participant in this chat' })
  otherParticipant!: UserReferenceDto | null

  @ApiProperty({ type: ChatMessagePreviewDto, nullable: true, description: 'The most recent message visible to the current user' })
  lastMessage!: ChatMessagePreviewDto | null

  @ApiProperty({ description: 'Whether the current user has unread messages in this chat' })
  hasUnread!: boolean

  @ApiProperty({ description: 'When the current user archived this chat, if they did', nullable: true, type: 'string' })
  archivedAt!: Date | null

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date
}
