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

/**
 * Nest-level authorization: creation limits, edit/delete/transfer rights. Read-context checks
 * delegate to {@link NestAccess}.
 */
@Injectable()
export class NestPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly memberRepo: NestMemberRepository
  ) { }

  /**
   * @param actorUserId - The user attempting to create a nest.
   * @throws {NestLimitReachedException} The user already owns {@link NEST_OWNER_LIMIT} nests.
   */
  async assertCanCreateNest(actorUserId: string) {
    const count = await this.memberRepo.countByRole(actorUserId, NestMemberRole.OWNER)

    if (count >= NEST_OWNER_LIMIT) {
      throw new NestLimitReachedException()
    }
  }

  /**
   * Self-contained variant for callers that already have an access context on hand.
   *
   * @param accessContext - A context previously computed by {@link NestAccess.getContext}.
   * @throws {InsufficientPermissionsException} `accessContext.canViewNest` is false.
   */
  async assertCanViewNestByAccessContext(accessContext: NestAccessContext) {
    if (!accessContext.canViewNest) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @param nest - The nest being edited.
   * @param actorUserId - The user attempting the edit.
   * @throws {InsufficientPermissionsException} Not authorized to edit this nest.
   */
  async assertCanUpdateNest(nest: NestPolicySubject, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.canEditNest) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @param nest - The nest being deleted.
   * @param actorUserId - The user attempting the deletion.
   * @throws {InsufficientPermissionsException} Not authorized to delete this nest.
   */
  async assertCanDeleteNest(nest: NestPolicySubject, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.canDeleteNest) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @param nest - The nest whose ownership is transferring.
   * @param actorUserId - The current owner.
   * @param targetUserId - The prospective new owner.
   * @throws {CannotTransferOwnershipToSelfException} `actorUserId === targetUserId`.
   * @throws {InsufficientPermissionsException} `actorUserId` isn't the current owner.
   * @throws {TargetUserNotMemberException} `targetUserId` isn't a member of this nest.
   */
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