import { BadRequestException } from '@nestjs/common'
import { BlocksErrorCodes } from '../constants/block.error-codes'

export class CannotBlockYourselfException extends BadRequestException {
  constructor() {
    super({ code: BlocksErrorCodes.CANNOT_BLOCK_YOURSELF, message: 'You cannot block yourself' })
  }
}
