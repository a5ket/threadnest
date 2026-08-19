import { ApiProperty } from '@nestjs/swagger'

export class UserSuspensionActiveResponseDto {
  @ApiProperty({ description: 'Whether the user currently has an active suspension' })
  suspended!: boolean

  @ApiProperty({ description: 'Reason for the active suspension, if any', nullable: true })
  reason!: string | null
}
