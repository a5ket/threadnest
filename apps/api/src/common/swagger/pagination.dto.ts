import { ApiProperty } from '@nestjs/swagger'

export class PaginationDto {
  @ApiProperty({ description: 'Cursor to fetch the next page, or null if there are no more results', nullable: true, type: 'string' })
  nextCursor!: string | null

  @ApiProperty({ description: 'Whether more results are available' })
  hasMore!: boolean
}
