import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestMemberRepository } from '../member/nest-member.repository'

@Injectable()
export class UserNestPreferencePolicy {
  constructor(private readonly membersRepo: NestMemberRepository) { }

  async assertCanManage(userId: string, nestId: string) {
    const isMember = await this.membersRepo.exists(nestId, userId)

    if (!isMember) {
      throw new InsufficientPermissionsException()
    }
  }
}