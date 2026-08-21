import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { USER_PREFERENCE_SELECT } from './selects/user-preference.select'

@Injectable()
export class UserPreferenceRepository {
  constructor(private readonly prisma: PrismaService) { }

  getByUserId(userId: string) {
    return this.prisma.userPreference.findUnique({
      where: { userId },
      select: USER_PREFERENCE_SELECT
    })
  }

  upsert(userId: string, showActivityOnProfile: boolean) {
    return this.prisma.userPreference.upsert({
      where: { userId },
      update: { showActivityOnProfile },
      create: { userId, showActivityOnProfile },
      select: USER_PREFERENCE_SELECT
    })
  }
}
