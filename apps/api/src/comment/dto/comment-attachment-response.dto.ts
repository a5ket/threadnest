import { ApiProperty } from '@nestjs/swagger'

export class CommentAttachmentResponseDto {
  @ApiProperty({ description: 'Presigned, time-limited URL — refetch the comment once it expires rather than caching this indefinitely' })
  url!: string

  @ApiProperty({ description: 'Image width in pixels' })
  width!: number

  @ApiProperty({ description: 'Image height in pixels' })
  height!: number
}
