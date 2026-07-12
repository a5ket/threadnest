import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { Database } from 'src/prisma/types/database'
import { USER_PROFILE_SELECT } from './constants/user-profile.select'
import { UpdateProfileDto } from './dto/update-profile.dto'

@Injectable()
export class UserProfileRepository {
  constructor(private readonly prisma: PrismaService) { }

  async create(userId: string, username: string, db: Database = this.prisma) {
    return db.userProfile.create({
      data: { userId, username },
      select: USER_PROFILE_SELECT
    })
  }

  async isUsernameTaken(username: string, excludeUserId?: string) {
    const existing = await this.prisma.userProfile.findUnique({
      where: { username },
      select: { userId: true }
    })

    if (!existing) return false
    if (excludeUserId && existing.userId === excludeUserId) return false

    return true
  }

  async getByUserId(userId: string) {
    return this.prisma.userProfile.findUnique({
      where: { userId },
      select: USER_PROFILE_SELECT
    })
  }

  async getByUsername(username: string) {
    return this.prisma.userProfile.findUnique({
      where: { username },
      select: { userId: true, ...USER_PROFILE_SELECT }
    })
  }

  async update(userId: string, dto: UpdateProfileDto) {
    return this.prisma.userProfile.update({
      where: { userId },
      data: dto,
      select: USER_PROFILE_SELECT
    })
  }
}
