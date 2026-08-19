import { ApiProperty } from '@nestjs/swagger'

export class ChatUnreadCountResponseDto {
  @ApiProperty({ description: 'Number of chats with unread messages for the current user' })
  count!: number
}
