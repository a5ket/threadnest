import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import { Lowercase } from 'src/common/transforms/lowercase.transform'
import { Trim } from 'src/common/transforms/trim.transform'

export class LoginDto {
  @Trim()
  @Lowercase()
  @IsEmail()
  @MaxLength(320)
  email!: string

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}