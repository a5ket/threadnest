import { IsString, Length } from 'class-validator'
import { Trim } from 'src/common/transforms/trim.transform'

export class ThreadUpdateDto {
  @Trim()
  @IsString()
  @Length(3, 128)
  title!: string

  @Trim()
  @IsString()
  @Length(1, 10000)
  content!: string
}