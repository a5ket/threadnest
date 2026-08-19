import { NotFoundException } from '@nestjs/common'
import { UserSuspensionErrorCodes } from '../constants/user-suspension.error-codes'

export class UserSuspensionNotFoundException extends NotFoundException {
  constructor() {
    super({ code: UserSuspensionErrorCodes.SUSPENSION_NOT_FOUND, message: 'User is not suspended' })
  }
}
