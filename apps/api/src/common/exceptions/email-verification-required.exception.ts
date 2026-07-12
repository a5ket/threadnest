import { ForbiddenException } from '@nestjs/common'
import { CommonErrorCodes } from '../constants/common.error-codes'

export class EmailVerificationRequiredException extends ForbiddenException {
  constructor() {
    super({ code: CommonErrorCodes.EMAIL_VERIFICATION_REQUIRED, message: 'Email verification required' })
  }
}
