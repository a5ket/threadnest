import { ConflictException } from '@nestjs/common'
import { PlatformRoleGrantErrorCodes } from '../constants/platform-role-grant.error-codes'

export class UserAlreadyHasActiveRoleException extends ConflictException {
  constructor() {
    super({ code: PlatformRoleGrantErrorCodes.ALREADY_HAS_ACTIVE_ROLE, message: 'User already has an active platform role' })
  }
}
