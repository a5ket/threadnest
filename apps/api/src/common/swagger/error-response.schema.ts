import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

class FieldError {
  @ApiProperty({ example: 'email' })
  field!: string

  @ApiProperty({ example: ['email must be an email'], type: [String] })
  errors!: string[]
}

class ErrorBody {
  @ApiProperty({ example: 401 })
  status!: number

  @ApiProperty({ example: 'INVALID_REFRESH_TOKEN' })
  code!: string

  @ApiProperty({ example: 'Invalid refresh token' })
  message!: string

  @ApiPropertyOptional({ type: [FieldError] })
  fields?: FieldError[]
}

export class ErrorResponse {
  @ApiProperty({ type: ErrorBody })
  error!: ErrorBody
}
