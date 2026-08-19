import { BadRequestException } from '@nestjs/common'
import { ChatErrorCodes } from '../constants/chat.error-codes'

export class ReplyTargetNotInChatException extends BadRequestException {
  constructor() {
    super({ code: ChatErrorCodes.REPLY_TARGET_NOT_IN_CHAT, message: 'The message being replied to is not in this chat' })
  }
}
