import { ForbiddenException } from '@nestjs/common'
import { NestInvitesErrorCodes } from '../constants/nest-invite.error-codes'

export class InvitesNotAllowedException extends ForbiddenException {
  constructor() {
    super({ code: NestInvitesErrorCodes.INVITES_NOT_ALLOWED, message: 'User does not allow invites from this nest' })
  }
}