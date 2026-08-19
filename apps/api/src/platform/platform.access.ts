import { Injectable } from '@nestjs/common'
import { NON_PLATFORM_MEMBER_LEVEL, PLATFORM_ACCESS_LEVEL } from './constants/platform-access-level'
import { PlatformRoleGrantRepository } from './role-grant/platform-role-grant.repository'
import { PlatformAccessContext } from './types/platform-access-context'

@Injectable()
export class PlatformAccess {
  constructor(
    private readonly grantsRepo: PlatformRoleGrantRepository
  ) { }

  async getContext(userId?: string): Promise<PlatformAccessContext> {
    const role = userId ? await this.grantsRepo.getActiveRole(userId) : null
    const level = role ? PLATFORM_ACCESS_LEVEL[role] : NON_PLATFORM_MEMBER_LEVEL

    return {
      level,
      isModerator: level >= PLATFORM_ACCESS_LEVEL.MODERATOR,
      isAdmin: level >= PLATFORM_ACCESS_LEVEL.ADMIN
    }
  }
}
