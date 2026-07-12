import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { USER_NEST_PREFERENCE_SELECT } from './constants/user-nest-preference.select'

@Injectable()
export class UserNestPreferenceRepository {
  constructor(private readonly prisma: PrismaService) { }

  getByUserAndNest(userId: string, nestId: string) {
    return this.prisma.userNestPreference.findUnique({
      where: { userId_nestId: { userId, nestId } },
      select: USER_NEST_PREFERENCE_SELECT
    })
  }

  async allowsInvites(userId: string, nestId: string) {
    const preference = await this.prisma.userNestPreference.findUnique({
      where: { userId_nestId: { userId, nestId } },
      select: { allowInvites: true }
    })

    return preference?.allowInvites ?? true
  }

  upsert(userId: string, nestId: string, allowInvites: boolean, muted: boolean) {
    return this.prisma.userNestPreference.upsert({
      where: { userId_nestId: { userId, nestId } },
      update: { allowInvites, muted },
      create: { userId, nestId, allowInvites, muted },
      select: USER_NEST_PREFERENCE_SELECT
    })
  }
}