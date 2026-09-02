import { Injectable } from '@nestjs/common'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { UserService } from 'src/user/user.service'
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
    private readonly bansRepo: NestBanRepository,
    private readonly users: UserService
  ) { }

  /**
   * If the target is a current member, the actor must outrank them — a moderator can't ban an
   * owner or a fellow moderator.
   *
   * @param nestId - The nest to ban in.
   * @param actorUserId - The user attempting the ban.
   * @param targetUserId - The user to ban.
   * @throws {CannotBanYourselfException} `actorUserId === targetUserId`.
   * @throws {InsufficientPermissionsException} Not authorized, or outranked by the target member.
   * @throws {UserAlreadyBannedException} Already actively banned.
   */
  async assertCanBanUser(nestId: string, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new CannotBanYourselfException()
    }

    const accessContext = await this.nestAccess.getContext(nestId, actorUserId)

    if (!accessContext.canManageBans || !accessContext.role) {
      throw new InsufficientPermissionsException()
    }

    await this.users.assertUserExists(targetUserId)

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

  /**
   * @param nestId - The nest to unban in.
   * @param actorUserId - The user attempting the unban.
   * @param targetUserId - The user to unban.
   * @throws {CannotUnbanYourselfException} `actorUserId === targetUserId`.
   * @throws {InsufficientPermissionsException} Not authorized to manage bans in this nest.
   */
  async assertCanUnbanUser(nestId: string, actorUserId: string, targetUserId: string) {
    if (actorUserId === targetUserId) {
      throw new CannotUnbanYourselfException()
    }

    const accessContext = await this.nestAccess.getContext(nestId, actorUserId)

    if (!accessContext.canManageBans || !accessContext.role) {
      throw new InsufficientPermissionsException()
    }
  }

  /**
   * @param nestId - The nest whose ban list is being viewed.
   * @param actorUserId - The viewer.
   * @throws {InsufficientPermissionsException} Not authorized to manage bans in this nest.
   */
  async assertCanViewBans(nestId: string, actorUserId: string) {
    const access = await this.nestAccess.getContext(nestId, actorUserId)

    if (!access.canManageBans || !access.role) {
      throw new InsufficientPermissionsException()
    }
  }
}