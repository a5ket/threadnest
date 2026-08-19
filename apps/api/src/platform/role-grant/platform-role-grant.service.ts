import { Injectable } from '@nestjs/common'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { UserService } from 'src/user/user.service'
import { PlatformRoleGrantCreateDto } from './dto/platform-role-grant-create.dto'
import { PlatformRoleGrantPolicy } from './platform-role-grant.policy'
import { PlatformRoleGrantPresenter } from './platform-role-grant.presenter'
import { PlatformRoleGrantRepository } from './platform-role-grant.repository'

@Injectable()
export class PlatformRoleGrantService {
  constructor(
    private readonly user: UserService,
    private readonly roleGrant: PlatformRoleGrantRepository,
    private readonly policy: PlatformRoleGrantPolicy,
    private readonly presenter: PlatformRoleGrantPresenter,
    private readonly transactionManager: TransactionManager
  ) { }

  async grantRole(userId: string, actorUserId: string, dto: PlatformRoleGrantCreateDto) {
    await this.policy.assertIsAdmin(actorUserId)
    await this.user.assertUserExists(userId)

    const grant = await this.roleGrant.create(userId, actorUserId, dto)

    return this.presenter.toView(grant)
  }

  async grantRoleBySystemForEmail(userEmail: string, dto: PlatformRoleGrantCreateDto) {
    const user = await this.user.getByEmail(userEmail)

    return this.roleGrant.createWithoutActor(user.id, dto)
  }

  // Revokes the current active grant and creates the new one atomically, so a failure never leaves the user with no role at all.
  async changeRole(userId: string, actorUserId: string, dto: PlatformRoleGrantCreateDto) {
    await this.policy.assertIsAdmin(actorUserId)
    await this.user.assertUserExists(userId)

    const grant = await this.transactionManager.run(async (tx) => {
      await this.roleGrant.revoke(userId, actorUserId, tx)
      return this.roleGrant.create(userId, actorUserId, dto, tx)
    })

    return this.presenter.toView(grant)
  }

  async revokeRole(userId: string, actorUserId: string) {
    await this.policy.assertIsAdmin(actorUserId)

    await this.roleGrant.revoke(userId, actorUserId)
  }

  async getActiveRole(userId: string, actorUserId: string) {
    await this.policy.assertIsAdmin(actorUserId)

    const role = await this.roleGrant.getActiveRole(userId)

    return this.presenter.toActiveRoleView(role)
  }
}
