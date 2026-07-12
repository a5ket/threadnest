import { UnauthorizedException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class InvalidCredentialsException extends UnauthorizedException {
  constructor() {
    super({ code: AuthErrorCodes.INVALID_CREDENTIALS, message: 'Invalid credentials' })
  }
}
