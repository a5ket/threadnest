import { ConflictException } from '@nestjs/common'
import { NestInvitesErrorCodes } from '../constants/nest-invite.error-codes'

export class AlreadyInvitedException extends ConflictException {
  constructor() {
    super({ code: NestInvitesErrorCodes.ALREADY_INVITED, message: 'User is already invited' })
  }
}