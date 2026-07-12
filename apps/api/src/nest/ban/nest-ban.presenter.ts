import { Injectable } from '@nestjs/common'
import { UserPresenter } from 'src/user/user.presenter'
import { NestBanSummary } from './types/nest-ban.summary'

@Injectable()
export class NestBanPresenter {
  constructor(private readonly userPresenter: UserPresenter) { }

  toSummaryView(ban: NestBanSummary) {
    return {
      user: this.userPresenter.toSummaryView(ban.user),
      bannedBy: this.userPresenter.toSummaryView(ban.bannedBy),
      reason: ban.reason,
      bannedAt: ban.createdAt,
    }
  }
}
