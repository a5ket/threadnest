import { ApiProperty } from '@nestjs/swagger'

export class ThreadAttachmentResponseDto {
  @ApiProperty({ description: 'Attachment ID' })
  id!: string

  @ApiProperty({ description: 'Storage key — pass this back (unchanged) when updating the thread to keep this attachment' })
  key!: string

  @ApiProperty({ description: 'Presigned, time-limited URL — refetch the thread once it expires rather than caching this indefinitely' })
  url!: string

  @ApiProperty({ description: 'Image width in pixels' })
  width!: number

  @ApiProperty({ description: 'Image height in pixels' })
  height!: number
}
