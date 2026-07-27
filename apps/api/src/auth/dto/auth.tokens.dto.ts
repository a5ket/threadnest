import { ApiProperty } from '@nestjs/swagger'

export class AuthTokensDto {
  @ApiProperty({ description: 'Short-lived JWT used to authenticate API requests' })
  accessToken!: string

  @ApiProperty({ description: 'Long-lived token used to obtain a new access token. Also set as an httpOnly cookie.' })
  refreshToken!: string
}
