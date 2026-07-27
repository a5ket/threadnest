import { IsEmail, MaxLength } from 'class-validator'
import { Lowercase } from 'src/common/transforms/lowercase.transform'
import { Trim } from 'src/common/transforms/trim.transform'

export class RequestPasswordResetDto {
  /**
   * The email address of the account to request a password reset for
   * @example user@example.com
   */
  @Trim()
  @Lowercase()
  @IsEmail()
  @MaxLength(320)
  email!: string
}
