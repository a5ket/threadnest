import { ConflictException } from '@nestjs/common'
import { BlocksErrorCodes } from '../constants/block.error-codes'

export class AlreadyBlockedException extends ConflictException {
  constructor() {
    super({ code: BlocksErrorCodes.ALREADY_BLOCKED, message: 'User is already blocked' })
  }
}
