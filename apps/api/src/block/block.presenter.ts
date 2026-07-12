import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { BlockedUser } from './types/blocked-user'

@Injectable()
export class BlockPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toView(block: BlockedUser) {
    return {
      user: this.userPresenter.toSummaryView(block.blocked),
      blockedAt: block.createdAt,
    }
  }
}
