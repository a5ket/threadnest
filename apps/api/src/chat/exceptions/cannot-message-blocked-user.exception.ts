import { ForbiddenException } from '@nestjs/common'
import { ChatErrorCodes } from '../constants/chat.error-codes'

export class CannotMessageBlockedUserException extends ForbiddenException {
  constructor() {
    super({ code: ChatErrorCodes.CANNOT_MESSAGE_BLOCKED_USER, message: 'You cannot message this user' })
  }
}
