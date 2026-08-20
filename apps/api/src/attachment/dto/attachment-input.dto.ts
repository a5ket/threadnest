import { IsInt, IsString, Min } from 'class-validator'

export class AttachmentInputDto {
  @IsString()
  key!: string

  @IsInt()
  @Min(1)
  width!: number

  @IsInt()
  @Min(1)
  height!: number
}
