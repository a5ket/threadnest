import { BadRequestException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class CannotChangeYourOwnRoleException extends BadRequestException {
  constructor() {
    super({ code: NestMembersErrorCodes.CANNOT_CHANGE_YOUR_OWN_ROLE, message: 'Cannot change your own role' })
  }
}
