import { Injectable } from '@nestjs/common'
import { NON_PLATFORM_MEMBER_LEVEL, PLATFORM_ACCESS_LEVEL } from './constants/platform-access-level'
import { PlatformRoleGrantRepository } from './role-grant/platform-role-grant.repository'
import { PlatformAccessContext } from './types/platform-access-context'

/** Computes a user's platform-wide (not nest-scoped) staff level from their active role grant. */
@Injectable()
export class PlatformAccess {
  constructor(
    private readonly grantsRepo: PlatformRoleGrantRepository
  ) { }

  /**
   * @param userId - The user to compute access for. Omit for an anonymous/unauthenticated
   * viewer, who always resolves to {@link NON_PLATFORM_MEMBER_LEVEL}.
   * @returns The user's numeric access level plus derived `isModerator`/`isAdmin` flags —
   * `isModerator` is true for admins too, since {@link PLATFORM_ACCESS_LEVEL} ranks ADMIN above
   * MODERATOR.
   */
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
