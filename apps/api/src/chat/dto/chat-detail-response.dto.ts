import { ApiProperty } from '@nestjs/swagger'
import { ChatAccessContextDto } from './chat-access-context.dto'
import { ChatSummaryResponseDto } from './chat-summary-response.dto'

export class ChatDetailResponseDto extends ChatSummaryResponseDto {
  @ApiProperty({ type: ChatAccessContextDto, description: 'The current user\'s access and permissions for this chat' })
  access!: ChatAccessContextDto

  @ApiProperty({ description: 'When the other participant last read this chat', nullable: true, type: 'string' })
  otherParticipantLastReadAt!: Date | null
}
