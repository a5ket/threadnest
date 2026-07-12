import { NotFoundException } from '@nestjs/common'
import { UserErrorCodes } from '../constants/user.error-codes'

export class UserNotFoundException extends NotFoundException {
  constructor() {
    super({ code: UserErrorCodes.USER_NOT_FOUND, message: 'User not found' })
  }
}
