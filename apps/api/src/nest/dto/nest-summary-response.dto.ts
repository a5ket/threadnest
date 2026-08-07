import { ApiProperty } from '@nestjs/swagger'

export class NestSummaryResponseDto {
  @ApiProperty({ description: 'Nest display name' })
  name!: string

  @ApiProperty({ description: 'Unique nest slug' })
  slug!: string

  @ApiProperty({ description: 'Nest description', nullable: true, type: 'string' })
  description!: string | null

  @ApiProperty({ description: 'Number of members' })
  memberCount!: number

  @ApiProperty({ description: 'Number of threads' })
  threadCount!: number

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date
}
