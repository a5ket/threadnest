import { ForbiddenException } from '@nestjs/common'
import { AuthErrorCodes } from '../constants/auth.error-codes'

export class UserSuspendedException extends ForbiddenException {
  constructor(reason: string) {
    super({ code: AuthErrorCodes.USER_SUSPENDED, message: 'This account has been suspended', reason })
  }
}
