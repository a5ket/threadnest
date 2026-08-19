import { BadRequestException } from '@nestjs/common'
import { ChatErrorCodes } from '../constants/chat.error-codes'

export class CannotChatWithYourselfException extends BadRequestException {
  constructor() {
    super({ code: ChatErrorCodes.CANNOT_CHAT_WITH_YOURSELF, message: 'You cannot start a chat with yourself' })
  }
}
