import { BadRequestException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class CannotRemoveYourselfException extends BadRequestException {
  constructor() {
    super({ code: NestMembersErrorCodes.CANNOT_REMOVE_YOURSELF, message: 'Cannot remove yourself' })
  }
}
