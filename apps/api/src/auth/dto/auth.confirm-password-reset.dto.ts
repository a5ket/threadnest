import { IsString, MaxLength, MinLength } from 'class-validator'

export class ConfirmPasswordResetDto {
  /**
   * The password reset confirmation token sent to the user's email address
   */
  @IsString()
  token!: string

  /**
   * The new account password
   * @example correct-horse-battery-staple
   */
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password!: string
}
