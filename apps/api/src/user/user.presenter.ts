import { Injectable } from '@nestjs/common'
import { UserSummary } from './types/user.summary'

@Injectable()
export class UserPresenter {
  toSummaryView(user: UserSummary) {
    return {
      id: user.id,
      username: user.profile?.username ?? null,
      displayName: user.profile?.displayName ?? null,
      avatarUrl: user.profile?.avatarUrl ?? null,
    }
  }
}
