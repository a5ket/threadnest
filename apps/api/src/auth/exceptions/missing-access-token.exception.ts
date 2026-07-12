import { UnauthorizedException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class MissingAccessTokenException extends UnauthorizedException {
  constructor() {
    super({ code: AuthErrorCodes.MISSING_ACCESS_TOKEN, message: 'Missing access token' })
  }
}
