import { GoneException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class TokenSupersededException extends GoneException {
  constructor() {
    super({ code: AuthErrorCodes.TOKEN_SUPERSEDED, message: 'Token has been superseded by a newer one' })
  }
}
