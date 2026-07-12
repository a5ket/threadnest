import { ForbiddenException } from '@nestjs/common'
import { CommonErrorCodes } from '../constants/common.error-codes'

export class InsufficientPermissionsException extends ForbiddenException {
  constructor() {
    super({ code: CommonErrorCodes.INSUFFICIENT_PERMISSIONS, message: 'Insufficient permissions' })
  }
}