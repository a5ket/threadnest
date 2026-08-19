import { ConflictException } from '@nestjs/common'
import { UserSuspensionErrorCodes } from '../constants/user-suspension.error-codes'

export class CannotSuspendYourselfException extends ConflictException {
  constructor() {
    super({ code: UserSuspensionErrorCodes.CANNOT_SUSPEND_YOURSELF, message: 'You cannot suspend your own account' })
  }
}
