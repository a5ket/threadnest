import { ConflictException } from '@nestjs/common'
import { NestsErrorCodes } from '../constants/nest.error-codes'

export class TargetUserNotMemberException extends ConflictException {
  constructor() {
    super({ code: NestsErrorCodes.TARGET_USER_NOT_MEMBER, message: 'Target user is not a member' })
  }
}
