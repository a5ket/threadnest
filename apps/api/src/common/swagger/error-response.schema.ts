import { ApiProperty } from '@nestjs/swagger'

export class FieldError {
  @ApiProperty({ example: 'email' })
  field!: string

  @ApiProperty({ example: ['email must be an email'], type: [String] })
  errors!: string[]
}
