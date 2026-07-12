import { ConflictException } from '@nestjs/common'
import { NestBansErrorCodes } from '../constants/nest-ban.error-codes'

export class UserAlreadyBannedException extends ConflictException {
  constructor() {
    super({ code: NestBansErrorCodes.ALREADY_BANNED, message: 'User is already banned' })
  }
}
