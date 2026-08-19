import { NotFoundException } from '@nestjs/common'
import { ChatErrorCodes } from '../constants/chat.error-codes'

export class MessageNotFoundException extends NotFoundException {
  constructor() {
    super({ code: ChatErrorCodes.MESSAGE_NOT_FOUND, message: 'Message not found' })
  }
}
