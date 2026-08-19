import { NotFoundException } from '@nestjs/common'
import { ChatErrorCodes } from '../constants/chat.error-codes'

export class ChatNotFoundException extends NotFoundException {
  constructor() {
    super({ code: ChatErrorCodes.CHAT_NOT_FOUND, message: 'Chat not found' })
  }
}
