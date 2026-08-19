import { ConflictException } from '@nestjs/common'
import { UserSuspensionErrorCodes } from '../constants/user-suspension.error-codes'

export class UserAlreadySuspendedException extends ConflictException {
  constructor() {
    super({ code: UserSuspensionErrorCodes.ALREADY_SUSPENDED, message: 'User is already suspended' })
  }
}
