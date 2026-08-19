import { ApiProperty } from '@nestjs/swagger'

export class ChatAccessContextDto {
  @ApiProperty({ description: 'Whether the current user is a participant in this chat' })
  isParticipant!: boolean

  @ApiProperty({ description: 'Whether the current user can view this chat' })
  canViewChat!: boolean

  @ApiProperty({ description: 'Whether the current user can send a message in this chat' })
  canSendMessage!: boolean

  @ApiProperty({ description: 'Whether the current user has blocked the other participant' })
  youBlockedThem!: boolean

  @ApiProperty({ description: 'Whether the other participant has blocked the current user' })
  blockedByThem!: boolean
}
