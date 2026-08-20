import { Type } from 'class-transformer'
import { IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator'
import { AttachmentInputDto } from 'src/attachment/dto/attachment-input.dto'

export class CommentCreateDto {
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  content!: string

  @ValidateNested()
  @Type(() => AttachmentInputDto)
  @IsOptional()
  attachment?: AttachmentInputDto
}
