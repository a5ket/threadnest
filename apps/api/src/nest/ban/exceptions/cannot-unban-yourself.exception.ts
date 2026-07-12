import { BadRequestException } from '@nestjs/common'
import { NestBansErrorCodes } from '../constants/nest-ban.error-codes'

export class CannotUnbanYourselfException extends BadRequestException {
  constructor() {
    super({ code: NestBansErrorCodes.CANNOT_UNBAN_YOURSELF, message: 'Cannot unban yourself' })
  }
}
