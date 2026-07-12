import { ConflictException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class EmailTakenException extends ConflictException {
  constructor() {
    super({ code: AuthErrorCodes.EMAIL_TAKEN, message: 'Email already exists' })
  }
}
