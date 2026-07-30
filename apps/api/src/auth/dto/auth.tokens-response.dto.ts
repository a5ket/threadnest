import { ApiProperty } from '@nestjs/swagger'
import { AuthTokensDto } from './auth.tokens.dto'

export class AuthTokensResponseDto {
  @ApiProperty({ type: AuthTokensDto })
  data!: AuthTokensDto
}
