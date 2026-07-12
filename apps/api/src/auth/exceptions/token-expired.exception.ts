import { GoneException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class TokenExpiredException extends GoneException {
  constructor() {
    super({ code: AuthErrorCodes.TOKEN_EXPIRED, message: 'Token has expired' })
  }
}
