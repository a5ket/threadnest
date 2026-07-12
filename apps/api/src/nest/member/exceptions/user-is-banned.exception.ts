import { ConflictException } from '@nestjs/common'
import { NestBansErrorCodes } from '../../ban/constants/nest-ban.error-codes'

export class UserIsBannedException extends ConflictException {
  constructor() {
    super({ code: NestBansErrorCodes.USER_BANNED, message: 'User is banned from this nest' })
  }
}
