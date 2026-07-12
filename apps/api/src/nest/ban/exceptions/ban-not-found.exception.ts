import { NotFoundException } from '@nestjs/common'
import { NestBansErrorCodes } from '../constants/nest-ban.error-codes'

export class BanNotFoundException extends NotFoundException {
  constructor() {
    super({ code: NestBansErrorCodes.BAN_NOT_FOUND, message: 'User is not banned' })
  }
}
