import { ApiProperty } from '@nestjs/swagger'

export class NestSlugAvailabilityResponseDto {
  @ApiProperty({ description: 'Whether the slug is available for use' })
  available!: boolean
}
