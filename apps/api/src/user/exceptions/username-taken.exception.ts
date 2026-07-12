import { ConflictException } from '@nestjs/common'
import { UserErrorCodes } from '../constants/user.error-codes'

export class UsernameTakenException extends ConflictException {
  constructor() {
    super({ code: UserErrorCodes.USERNAME_TAKEN, message: 'Username is already taken' })
  }
}
