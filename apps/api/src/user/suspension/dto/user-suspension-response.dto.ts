import { ApiProperty } from '@nestjs/swagger'

export class UserSuspensionResponseDto {
  @ApiProperty({ description: 'The suspended user' })
  userId!: string

  @ApiProperty({ description: 'Reason for the suspension' })
  reason!: string

  @ApiProperty({ description: 'The admin or moderator who issued the suspension', nullable: true })
  suspendedById!: string | null

  @ApiProperty({ description: 'When the suspension was issued' })
  createdAt!: Date
}
