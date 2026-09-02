import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { BlockedUser } from './types/blocked-user'

/** Shapes a block row into its API response. */
@Injectable()
export class BlockPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  /**
   * @param block - The block row, with the blocked user's summary data preloaded.
   * @returns The block's view: the blocked user's summary plus when the block was created.
   */
  toView(block: BlockedUser) {
    return {
      user: this.userPresenter.toSummaryView(block.blocked),
      blockedAt: block.createdAt,
    }
  }
}
