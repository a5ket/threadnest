import { ForbiddenException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class JoinNotOpenException extends ForbiddenException {
  constructor() {
    super({ code: NestMembersErrorCodes.JOIN_NOT_OPEN, message: 'This nest doesn\'t allow joining directly' })
  }
}
