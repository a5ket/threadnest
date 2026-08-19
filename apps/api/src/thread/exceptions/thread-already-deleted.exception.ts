import { ConflictException } from '@nestjs/common'
import { ThreadsErrorCodes } from '../constants/thread.error-codes'

export class ThreadAlreadyDeletedException extends ConflictException {
  constructor() {
    super({ code: ThreadsErrorCodes.THREAD_ALREADY_DELETED, message: 'This thread has already been deleted' })
  }
}
