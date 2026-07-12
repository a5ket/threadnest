import { UnauthorizedException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class InvalidAccessTokenException extends UnauthorizedException {
  constructor() {
    super({ code: AuthErrorCodes.INVALID_ACCESS_TOKEN, message: 'Invalid access token' })
  }
}
