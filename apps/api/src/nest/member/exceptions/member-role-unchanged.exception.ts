import { BadRequestException } from '@nestjs/common'
import { NestMembersErrorCodes } from '../constants/nest-members.error-codes'

export class MemberRoleUnchangedException extends BadRequestException {
  constructor() {
    super({ code: NestMembersErrorCodes.MEMBER_ROLE_UNCHANGED, message: 'Member role is already set to the target role' })
  }
}
