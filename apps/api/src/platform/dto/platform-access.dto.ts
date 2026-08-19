import { ApiProperty } from '@nestjs/swagger'

export class PlatformAccessDto {
  @ApiProperty({ description: 'Numeric platform access level (0 for no platform role)' })
  level!: number

  @ApiProperty({ description: 'Whether the current user holds at least the MODERATOR platform role' })
  isModerator!: boolean

  @ApiProperty({ description: 'Whether the current user holds the ADMIN platform role' })
  isAdmin!: boolean
}
