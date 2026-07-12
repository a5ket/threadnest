import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/prisma/prisma.service'
import { NestSettingsNotFoundException } from './exceptions/nest-settings-not-found.exception'
import { Database } from 'src/prisma/types/database'
import { NEST_SETTINGS_SELECT } from './constants/nest-settings.select'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'

@Injectable()
export class NestSettingsRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(nestId: string, db: Database = this.prisma) {
    return db.nestSettings.create({
      data: { nestId },
      select: NEST_SETTINGS_SELECT,
    })

  }

  async get(nestId: string) {
    const settings = await this.prisma.nestSettings.findUnique({
      where: { nestId },
      select: NEST_SETTINGS_SELECT
    })

    if (!settings) {
      throw new NestSettingsNotFoundException()
    }

    return settings
  }

  async update(nestId: string, dto: NestSettingsUpdateDto, db: Database = this.prisma,) {
    try {
      return await db.nestSettings.update({
        where: { nestId },
        data: {
          visibility: dto.visibility,
          joinPolicy: dto.joinPolicy,

          minThreadCreationRole: dto.minThreadCreationRole,
          minCommentCreationRole: dto.minCommentCreationRole,

          minNestEditRole: dto.minNestEditRole,

          minThreadLockManageRole: dto.minThreadLockManageRole,
          minThreadPinManageRole: dto.minThreadPinManageRole,
          minCommentPinManageRole: dto.minCommentPinManageRole,

          minContentModerateRole: dto.minContentModerateRole,
          minMemberViewRole: dto.minMemberViewRole,

          minInviteManageRole: dto.minInviteManageRole,
          minMemberRemoveRole: dto.minMemberRemoveRole,
          minJoinRequestManageRole: dto.minJoinRequestManageRole,
          minBanManageRole: dto.minBanManageRole,
        },
        select: NEST_SETTINGS_SELECT,
      })
    } catch (error) {
      if (this.prisma.isRecordNotFoundError(error)) {
        throw new NestSettingsNotFoundException()
      }

      throw error
    }
  }
}