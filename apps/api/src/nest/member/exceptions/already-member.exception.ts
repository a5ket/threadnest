import { ConflictException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class AlreadyMemberException extends ConflictException {
  constructor() {
    super({ code: NestMembersErrorCodes.ALREADY_A_MEMBER, message: 'User is already a member' })
  }
}
