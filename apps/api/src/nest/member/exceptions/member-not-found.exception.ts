import { NotFoundException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class MemberNotFoundException extends NotFoundException {
  constructor() {
    super({ code: NestMembersErrorCodes.MEMBER_NOT_FOUND, message: 'Member not found' })
  }
}
