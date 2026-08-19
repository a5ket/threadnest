import { ApiProperty } from '@nestjs/swagger'

export class PlatformContentBulkRemovalResponseDto {
  @ApiProperty({ description: 'Number of threads removed' })
  threadsRemoved!: number

  @ApiProperty({ description: 'Number of comments removed' })
  commentsRemoved!: number
}
