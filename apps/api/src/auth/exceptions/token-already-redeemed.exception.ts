import { GoneException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class TokenAlreadyRedeemedException extends GoneException {
  constructor() {
    super({ code: AuthErrorCodes.TOKEN_ALREADY_REDEEMED, message: 'Token has already been used' })
  }
}
