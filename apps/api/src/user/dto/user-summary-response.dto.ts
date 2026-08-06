import { ApiProperty } from '@nestjs/swagger'

export class UserSummaryResponseDto {
  @ApiProperty({ description: 'User ID' })
  id!: string

  @ApiProperty({ description: 'Username. Null if the user has no profile', nullable: true, type: 'string' })
  username!: string | null

  @ApiProperty({ description: 'Display name. Null if the user has no profile or none is set', nullable: true, type: 'string' })
  displayName!: string | null

  @ApiProperty({ description: 'Avatar URL. Null if the user has no profile or none is set', nullable: true, type: 'string' })
  avatarUrl!: string | null
}
