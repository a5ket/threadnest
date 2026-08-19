import { ApiProperty } from '@nestjs/swagger'

export class ChatMessagePreviewDto {
  @ApiProperty({ description: 'Message ID' })
  id!: string

  @ApiProperty({ description: 'Message content. Null if the message was deleted', nullable: true, type: 'string' })
  content!: string | null

  @ApiProperty({ description: 'ID of the user who sent this message' })
  senderId!: string

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'Deletion timestamp, if the message was deleted', nullable: true, type: 'string' })
  deletedAt!: Date | null
}
