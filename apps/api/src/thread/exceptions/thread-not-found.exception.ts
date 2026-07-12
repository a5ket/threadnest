import { NotFoundException } from '@nestjs/common'
import { ThreadsErrorCodes } from '../constants/thread.error-codes'

export class ThreadNotFoundException extends NotFoundException {
  constructor() {
    super({ code: ThreadsErrorCodes.THREAD_NOT_FOUND, message: 'Thread not found' })
  }
}
