import { BadRequestException } from '@nestjs/common'
import { CommonErrorCodes } from '../constants/common.error-codes'

export class InvalidCursorException extends BadRequestException {
  constructor() {
    super({ code: CommonErrorCodes.INVALID_CURSOR, message: 'Invalid pagination cursor' })
  }
}
