import { NotFoundException } from '@nestjs/common'
import { PlatformRoleGrantErrorCodes } from '../constants/platform-role-grant.error-codes'

export class PlatformRoleGrantNotFoundException extends NotFoundException {
  constructor() {
    super({ code: PlatformRoleGrantErrorCodes.GRANT_NOT_FOUND, message: 'User has no active platform role' })
  }
}
