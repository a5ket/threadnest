import { NotFoundException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class TokenNotFoundException extends NotFoundException {
  constructor() {
    super({ code: AuthErrorCodes.TOKEN_NOT_FOUND, message: 'Token not found' })
  }
}
