import { IsString } from 'class-validator'

export class ConfirmEmailVerificationDto {
  /**
   * The confirmation token sent to the user's email address
   */
  @IsString()
  token!: string
}
