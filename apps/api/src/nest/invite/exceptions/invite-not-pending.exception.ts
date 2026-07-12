import { ConflictException } from '@nestjs/common'
import { NestInvitesErrorCodes } from '../constants/nest-invite.error-codes'

export class InviteNotPendingException extends ConflictException {
  constructor() {
    super({ code: NestInvitesErrorCodes.INVITE_NOT_PENDING, message: 'Invite is not pending' })
  }
}
