import { Injectable } from '@nestjs/common'
import { NestJoinPolicy, NestMemberRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestAccess } from '../nest.access'
import { NestPolicySubject } from '../types/nest.policy-subject'
import { AlreadyMemberException } from './exceptions/already-member.exception'
import { CannotAssignHigherOrEqualRoleException } from './exceptions/cannot-assign-higher-or-equal-role.exception'
import { CannotChangeYourOwnRoleException } from './exceptions/cannot-change-your-own-role.exception'
import { CannotManageHigherRoleMemberException } from './exceptions/cannot-manage-higher-role-member.exception'
import { CannotRemoveYourselfException } from './exceptions/cannot-remove-yourself.exception'
import { JoinNotOpenException } from './exceptions/join-not-open.exception'
import { MemberNotFoundException } from './exceptions/member-not-found.exception'
import { MemberRoleUnchangedException } from './exceptions/member-role-unchanged.exception'
import { OwnerCannotLeaveException } from './exceptions/owner-cannot-leave.exception'
import { UserIsBannedException } from './exceptions/user-is-banned.exception'
import { NestMemberRepository } from './nest-member.repository'

@Injectable()
export class NestMemberPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly memberRepo: NestMemberRepository
  ) { }

  /**
   * @throws {UserIsBannedException} Actively banned from this nest.
   * @throws {AlreadyMemberException} Already a member.
   * @throws {JoinNotOpenException} This nest's join policy isn't `OPEN` (requires an invite or
   *   join request instead).
   */
  async assertCanJoinNest(nest: NestPolicySubject, userId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, userId)

    if (ctx.isBanned) {
      throw new UserIsBannedException()
    }

    if (ctx.isMember) {
      throw new AlreadyMemberException()
    }

    if (ctx.joinPolicy !== NestJoinPolicy.OPEN) {
      throw new JoinNotOpenException()
    }
  }

  /**
   * @throws {OwnerCannotLeaveException} The owner must transfer ownership first.
   * @throws {InsufficientPermissionsException} Not a member.
   */
  async assertCanLeaveNest(nest: NestPolicySubject, userId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, userId)

    if (ctx.role === NestMemberRole.OWNER) {
      throw new OwnerCannotLeaveException()
    }

    if (!ctx.canLeaveNest) {
      throw new InsufficientPermissionsException()
    }
  }

  /** @throws {InsufficientPermissionsException} Not authorized to view this nest's member list. */
  async assertCanListMembers(nest: NestPolicySubject, actorUserId: string) {
    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.canViewMembers) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @throws {CannotRemoveYourselfException} `actorUserId === targetUserId` (leave instead).
   * @throws {InsufficientPermissionsException} Not authorized, or outranked by the target.
   */
  async assertCanRemoveMember(nest: NestPolicySubject, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new CannotRemoveYourselfException()
    }

    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.role || !ctx.canRemoveMembers) {
      throw new InsufficientPermissionsException()
    }

    const targetMembership = await this.memberRepo.getByUser(nest.id, targetUserId)

    if (!this.nestAccess.isHigherRole(ctx.role, targetMembership.role)) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * The actor must outrank both the target's current role and the role being assigned — so a
   * moderator can demote another moderator but can't promote anyone to moderator or owner.
   *
   * @throws {CannotChangeYourOwnRoleException} `actorUserId === targetUserId`.
   * @throws {InsufficientPermissionsException} Not authorized to manage roles in this nest.
   * @throws {MemberNotFoundException} `targetUserId` isn't a member.
   * @throws {MemberRoleUnchangedException} `targetNewRole` matches the current role.
   * @throws {CannotManageHigherRoleMemberException} The actor doesn't outrank the target's current role.
   * @throws {CannotAssignHigherOrEqualRoleException} The actor doesn't outrank `targetNewRole`.
   */
  async assertCanChangeRole(nest: NestPolicySubject, actorUserId: string, targetUserId: string, targetNewRole: NestMemberRole) {
    if (actorUserId === targetUserId) {
      throw new CannotChangeYourOwnRoleException()
    }

    const ctx = await this.nestAccess.getContext(nest.id, actorUserId)

    if (!ctx.role || !ctx.canManageMemberRoles) {
      throw new InsufficientPermissionsException()
    }

    const targetMembership = await this.memberRepo.findByUser(nest.id, targetUserId)

    if (!targetMembership) {
      throw new MemberNotFoundException()
    }

    const actorRole = ctx.role
    const targetCurrentRole = targetMembership.role

    if (targetMembership.role === targetNewRole) {
      throw new MemberRoleUnchangedException()
    }

    const actorOutranksTarget = this.nestAccess.isHigherRole(actorRole, targetCurrentRole)
    const actorOutranksNewRole = this.nestAccess.isHigherRole(actorRole, targetNewRole)

    if (!actorOutranksTarget) {
      throw new CannotManageHigherRoleMemberException()
    }

    if (!actorOutranksNewRole) {
      throw new CannotAssignHigherOrEqualRoleException()
    }
  }
}