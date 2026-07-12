import { Injectable } from '@nestjs/common'
import { NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { CannotTransferOwnershipToSelfException } from './exceptions/cannot-transfer-ownership-to-self.exception'
import { NestLimitReachedException } from './exceptions/nest-limit-reached.exception'
import { TargetUserNotMemberException } from './exceptions/target-user-not-member.exception'
import { NestMemberRepository } from './member/nest-member.repository'
import { NestAccess } from './nest.access'
import { NestAccessContext } from './types/nest.access-context'
import { NestPolicySubject } from './types/nest.policy-subject'

const NEST_OWNER_LIMIT = 100

@Injectable()
export class NestPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly memberRepo: NestMemberRepository
  ) { }

  async assertCanCreateNest(actorUserId: string) {
    const count = await this.memberRepo.countByRole(actorUserId, NestMemberRole.OWNER)

    if (count >= NEST_OWNER_LIMIT) {
      throw new NestLimitReachedException()
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  async assertCanViewNestByAccessContext(accessContext: NestAccessContext) {
    if (!accessContext.canViewNest) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanUpdateNest(nest: NestPolicySubject, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.canEditNest) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanDeleteNest(nest: NestPolicySubject, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.canDeleteNest) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanTransferOwnership(nest: NestPolicySubject, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new CannotTransferOwnershipToSelfException()
    }

    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.isOwner) {
      throw new InsufficientPermissionsException()
    }

    const targetMembership = await this.memberRepo.findByUser(nest.id, targetUserId)

    if (!targetMembership) {
      throw new TargetUserNotMemberException()
    }
  }
}