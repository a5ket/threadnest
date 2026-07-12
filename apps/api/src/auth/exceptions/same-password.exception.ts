import { UnprocessableEntityException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class SamePasswordException extends UnprocessableEntityException {
  constructor() {
    super({ code: AuthErrorCodes.SAME_PASSWORD, message: 'New password must be different from the current password' })
  }
}
