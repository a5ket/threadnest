import { NotFoundException } from '@nestjs/common'
import { BlocksErrorCodes } from '../constants/block.error-codes'

export class NotBlockedException extends NotFoundException {
  constructor() {
    super({ code: BlocksErrorCodes.NOT_BLOCKED, message: 'User is not blocked' })
  }
}
