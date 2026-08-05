import { ApiProperty } from '@nestjs/swagger'

export class NestReferencetDto {
  @ApiProperty({ description: 'Nest display name' })
  name!: string

  @ApiProperty({ description: 'Unique nest slug' })
  slug!: string
}