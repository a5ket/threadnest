import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { USER_PREFERENCE_SELECT } from './selects/user-preference.select'

/**
 * Persistence for account-wide privacy preferences (currently just activity visibility). Returns
 * null when the user has never set one — the caller is expected to supply the default.
 */
@Injectable()
export class UserPreferenceRepository {
  constructor(private readonly prisma: PrismaService) { }

  /** @param userId - The account to look up. */
  getByUserId(userId: string) {
    return this.prisma.userPreference.findUnique({
      where: { userId },
      select: USER_PREFERENCE_SELECT
    })
  }

  /**
   * @param userId - The account to update.
   * @param showActivityOnProfile - The new preference value.
   */
  upsert(userId: string, showActivityOnProfile: boolean) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: { showActivityOnProfile },
      create: { userId, showActivityOnProfile },
      select: USER_PREFERENCE_SELECT
    })
  }
}
