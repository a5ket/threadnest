import { ApiProperty } from '@nestjs/swagger'

export class UserPreferenceResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string

  @ApiProperty({ description: 'Whether threads and comments authored by this user appear on their public profile' })
  showActivityOnProfile!: boolean
}
