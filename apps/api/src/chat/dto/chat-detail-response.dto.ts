import { ApiProperty } from '@nestjs/swagger'
import { ChatAccessContextDto } from './chat-access-context.dto'
import { ChatSummaryResponseDto } from './chat-summary-response.dto'

export class ChatDetailResponseDto extends ChatSummaryResponseDto {
  @ApiProperty({ type: ChatAccessContextDto, description: 'The current user\'s access and permissions for this chat' })
  access!: ChatAccessContextDto
}
