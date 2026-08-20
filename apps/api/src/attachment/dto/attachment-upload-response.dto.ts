import { ApiProperty } from '@nestjs/swagger'

export class AttachmentUploadResponseDto {
  @ApiProperty({ description: 'Storage key — pass this back when creating/updating a thread or comment' })
  key!: string

  @ApiProperty({ description: 'Processed image width in pixels' })
  width!: number

  @ApiProperty({ description: 'Processed image height in pixels' })
  height!: number
}
