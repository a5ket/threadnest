import { IsOptional, IsString, Length } from 'class-validator'
import { Trim } from 'src/common/transforms/trim.transform'

export class NestUpdateDto {
  @Trim()
  @IsString()
  @Length(3, 128)
  @IsOptional()
  name?: string

  @Trim()
  @IsString()
  @Length(0, 500)
  @IsOptional()
  description?: string
}