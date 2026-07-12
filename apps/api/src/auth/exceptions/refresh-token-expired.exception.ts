import { UnauthorizedException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class RefreshTokenExpiredException extends UnauthorizedException {
  constructor() {
    super({ code: AuthErrorCodes.REFRESH_TOKEN_EXPIRED, message: 'Refresh token expired' })
  }
}
