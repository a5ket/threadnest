import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator'
import { Lowercase } from 'src/common/transforms/lowercase.transform'
import { Trim } from 'src/common/transforms/trim.transform'

export class LoginDto {
  /**
   * The account email address
   * @example user@example.com
   */
  @Trim()
  @Lowercase()
  @IsEmail()
  @MaxLength(320)
  email!: string

  /**
   * The account password
   * @example correct-horse-battery-staple
   */
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}
