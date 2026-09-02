import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestMemberRepository } from '../member/nest-member.repository'

@Injectable()
export class UserNestPreferencePolicy {
  constructor(private readonly membersRepo: NestMemberRepository) { }

  /**
   * A user's preferences for a nest only make sense once they've joined it.
   *
   * @param userId - The user whose preferences are being read/changed.
   * @param nestId - The nest the preferences are scoped to.
   * @throws {InsufficientPermissionsException} `userId` isn't a member of `nestId`.
   */
  async assertCanManage(userId: string, nestId: string) {
    const isMember = await this.membersRepo.exists(nestId, userId)

    if (!isMember) {
      throw new InsufficientPermissionsException()
    }
  }
}