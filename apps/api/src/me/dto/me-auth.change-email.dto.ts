import { IsEmail, MaxLength } from 'class-validator'
import { Lowercase } from 'src/common/transforms/lowercase.transform'
import { Trim } from 'src/common/transforms/trim.transform'

export class ChangeEmailDto {
  @Trim()
  @Lowercase()
  @IsEmail()
  @MaxLength(320)
  email!: string
}
