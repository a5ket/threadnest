import { UnauthorizedException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class InvalidRefreshTokenException extends UnauthorizedException {
  constructor() {
    super({ code: AuthErrorCodes.INVALID_REFRESH_TOKEN, message: 'Invalid refresh token' })
  }
}
