import { Type } from 'class-transformer'
import { ArrayMaxSize, IsArray, IsOptional, IsString, Length, ValidateNested } from 'class-validator'
import { AttachmentInputDto } from 'src/attachment/dto/attachment-input.dto'
import { Trim } from 'src/common/transforms/trim.transform'

const MAX_ATTACHMENTS = 4

export class ThreadUpdateDto {
  @Trim()
  @IsString()
  @Length(3, 128)
  title!: string

  @Trim()
  @IsString()
  @Length(1, 10000)
  content!: string

  // Omitted = leave attachments unchanged. Present (even []) = replace the full set.
  @IsArray()
  @ArrayMaxSize(MAX_ATTACHMENTS)
  @ValidateNested({ each: true })
  @Type(() => AttachmentInputDto)
  @IsOptional()
  attachments?: AttachmentInputDto[]
}
