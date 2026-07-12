import { ForbiddenException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class CannotManageHigherRoleMemberException extends ForbiddenException {
  constructor() {
    super({ code: NestMembersErrorCodes.CANNOT_MANAGE_HIGHER_ROLE_MEMBER, message: 'Cannot manage role of equal or higher role member' })
  }
}
