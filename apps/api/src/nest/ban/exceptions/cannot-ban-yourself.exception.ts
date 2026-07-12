import { BadRequestException } from '@nestjs/common'
import { NestBansErrorCodes } from '../constants/nest-ban.error-codes'

export class CannotBanYourselfException extends BadRequestException {
  constructor() {
    super({ code: NestBansErrorCodes.CANNOT_BAN_YOURSELF, message: 'Cannot ban yourself' })
  }
}
