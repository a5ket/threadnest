import { NotFoundException } from '@nestjs/common'
import { UserErrorCodes } from '../constants/user.error-codes'

export class ProfileNotFoundException extends NotFoundException {
  constructor() {
    super({ code: UserErrorCodes.PROFILE_NOT_FOUND, message: 'Profile not found' })
  }
}
