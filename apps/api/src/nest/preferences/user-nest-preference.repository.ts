import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { USER_NEST_PREFERENCE_SELECT } from './selects/user-nest-preference.select'

/**
 * Persistence for a user's per-nest preferences. No row exists until the user changes something —
 * the defaults (`allowInvites: true`, `muted: false`) live in the callers that read this, not here.
 */
@Injectable()
export class UserNestPreferenceRepository {
  constructor(private readonly prisma: PrismaService) { }

  /**
   * @param userId - The user whose preferences to fetch.
   * @param nestId - The nest they're scoped to.
   * @returns The stored preferences, or `null` if the user has never customized them for this nest.
   */
  getByUserAndNest(userId: string, nestId: string) {
    return this.prisma.userNestPreference.findUnique({
      where: { userId_nestId: { userId, nestId } },
      select: USER_NEST_PREFERENCE_SELECT
    })
  }

  /**
   * @param userId - The prospective invite recipient.
   * @param nestId - The nest the invite would be for.
   * @returns Whether `userId` accepts invites to `nestId` — `true` if they've never set a
   * preference (the default).
   */
  async allowsInvites(userId: string, nestId: string) {
    const preference = await this.prisma.userNestPreference.findUnique({
      where: { userId_nestId: { userId, nestId } },
      select: { allowInvites: true }
    })

    return preference?.allowInvites ?? true
  }

  /**
   * @param userId - The user whose preferences to set.
   * @param nestId - The nest they're scoped to.
   * @param allowInvites - Whether other members can invite this user to the nest.
   * @param muted - Whether this user has muted notifications for the nest.
   * @returns The upserted preferences.
   */
  upsert(userId: string, nestId: string, allowInvites: boolean, muted: boolean) {
    return this.prisma.userNestPreference.upsert({
      where: { userId_nestId: { userId, nestId } },
      update: { allowInvites, muted },
      create: { userId, nestId, allowInvites, muted },
      select: USER_NEST_PREFERENCE_SELECT
    })
  }
}