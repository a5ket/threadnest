import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { NestMemberRepository } from '../member/nest-member.repository'
import { NestAccess } from '../nest.access'
import { CannotBanYourselfException } from './exceptions/cannot-ban-yourself.exception'
import { CannotUnbanYourselfException } from './exceptions/cannot-unban-yourself.exception'
import { UserAlreadyBannedException } from './exceptions/user-already-banned.exception'
import { NestBanRepository } from './nest-ban.repository'

@Injectable()
export class NestBanPolicy {
  constructor(
    private readonly nestAccess: NestAccess,
    private readonly membersRepo: NestMemberRepository,
    private readonly bansRepo: NestBanRepository
  ) { }

  async assertCanBanUser(nestId: string, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new CannotBanYourselfException()
    }

    const accessContext = await this.nestAccess.getContext(nestId, actorUserId)

    if (!accessContext.canManageBans || !accessContext.role) {
      throw new InsufficientPermissionsException()
    }

    const [targetMembership, isBanned] = await Promise.all([
      this.membersRepo.findByUser(nestId, targetUserId),
      this.bansRepo.existsActive(nestId, targetUserId)
    ])

    if (isBanned) {
      throw new UserAlreadyBannedException()
    }

    if (!targetMembership) {
      return
    }

    if (!this.nestAccess.isHigherRole(accessContext.role, targetMembership.role)) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanUnbanUser(nestId: string, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new CannotUnbanYourselfException()
    }

    const accessContext = await this.nestAccess.getContext(nestId, actorUserId)

    if (!accessContext.canManageBans || !accessContext.role) {
      throw new InsufficientPermissionsException()
    }
  }

  async assertCanViewBans(nestId: string, actorUserId: string) {
    const access = await this.nestAccess.getContext(nestId, actorUserId)

    if (!access.canManageBans || !access.role) {
      throw new InsufficientPermissionsException()
    }
  }
}