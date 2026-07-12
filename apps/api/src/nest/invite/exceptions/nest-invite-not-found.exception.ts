import { NotFoundException } from '@nestjs/common'
import { NestInvitesErrorCodes } from '../constants/nest-invite.error-codes'

export class NestInviteNotFoundException extends NotFoundException {
  constructor() {
    super({ code: NestInvitesErrorCodes.INVITE_NOT_FOUND, message: 'Invite not found' })
  }
}