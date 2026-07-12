import { ForbiddenException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class CannotAssignHigherOrEqualRoleException extends ForbiddenException {
  constructor() {
    super({ code: NestMembersErrorCodes.CANNOT_ASSIGN_HIGHER_OR_EQUAL_ROLE, message: 'Cannot promote to a higher or equal role' })
  }
}
