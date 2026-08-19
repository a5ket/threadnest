import { Injectable } from '@nestjs/common'
import { UserSuspensionCreateDto } from 'src/user/suspension/dto/user-suspension-create.dto'
import { UserSuspensionPresenter } from 'src/user/suspension/user-suspension.presenter'
import { UserSuspensionService } from 'src/user/suspension/user-suspension.service'
import { PlatformUserSuspensionPolicy } from './platform-user-suspension.policy'

@Injectable()
export class PlatformUserSuspensionService {
  constructor(
    private readonly policy: PlatformUserSuspensionPolicy,
    private readonly userSuspensions: UserSuspensionService,
    private readonly presenter: UserSuspensionPresenter
  ) { }

  async suspend(userId: string, actorUserId: string, dto: UserSuspensionCreateDto) {
    await this.policy.assertIsModerator(actorUserId)

    const suspension = await this.userSuspensions.suspend(userId, actorUserId, dto)

    return this.presenter.toView(suspension)
  }

  async unsuspend(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    await this.userSuspensions.unsuspend(userId, actorUserId)
  }

  async getActive(userId: string, actorUserId: string) {
    await this.policy.assertIsModerator(actorUserId)

    const active = await this.userSuspensions.getActive(userId)

    return this.presenter.toActiveView(active)
  }
}
