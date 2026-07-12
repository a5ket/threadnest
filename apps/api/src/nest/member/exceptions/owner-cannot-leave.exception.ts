import { ConflictException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class OwnerCannotLeaveException extends ConflictException {
  constructor() {
    super({ code: NestMembersErrorCodes.CANNOT_LEAVE_AS_OWNER, message: 'Owner cannot leave' })
  }
}
