import { Injectable } from '@nestjs/common'
import { NestMemberRole } from 'generated/prisma/enums'
import { StorageService } from 'src/storage/storage.service'
import { UserSummary } from './types/user.summary'

@Injectable()
export class UserPresenter {
  constructor(private readonly storage: StorageService) { }

  private resolveAvatarUrl(avatarKey: string | null | undefined) {
    return avatarKey ? this.storage.getPublicUrl(avatarKey) : null
  }

  toSummaryView(user: UserSummary) {
    return {
      id: user.id,
      username: user.profile?.username ?? null,
      displayName: user.profile?.displayName ?? null,
      avatarUrl: this.resolveAvatarUrl(user.profile?.avatarKey),
    }
  }

  // The shared shape behind UserReferenceDto — used everywhere a comment/thread author, chat
  // sender, notification actor, or nest member/ban/invite/report user is rendered.
  toReferenceView(user: UserSummary, role?: NestMemberRole | null) {
    return {
      id: user.id,
      profile: user.profile ? {
        username: user.profile.username,
        displayName: user.profile.displayName,
        avatarUrl: this.resolveAvatarUrl(user.profile.avatarKey),
      } : null,
      ...(role !== undefined && { role }),
    }
  }
}
