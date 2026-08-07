import { Injectable } from '@nestjs/common'
import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { PrismaService } from 'src/prisma/prisma.service'
import { NestSettingsNotFoundException } from './exceptions/nest-settings-not-found.exception'
import { Database } from 'src/prisma/types/database'
import { NEST_ACCESS_LEVEL } from '../constants/nest-access-level'
import { NEST_SETTINGS_SELECT } from './selects/nest-settings.select'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'

interface NestSettingsCreateOptions {
  visibility?: NestVisibility
  joinPolicy?: NestJoinPolicy
}

@Injectable()
export class NestSettingsRepository {
  constructor(
    private readonly prisma: PrismaService
  ) { }

  async create(nestId: string, options: NestSettingsCreateOptions = {}, db: Database = this.prisma) {
    return db.nestSettings.create({
      data: {
        nestId,

        visibility: options.visibility,
        joinPolicy: options.joinPolicy,

        minThreadCreationLevel: NEST_ACCESS_LEVEL.MEMBER,
        minCommentCreationLevel: NEST_ACCESS_LEVEL.MEMBER,

        minMemberViewLevel: NEST_ACCESS_LEVEL.MODERATOR,

        minNestEditLevel: NEST_ACCESS_LEVEL.MODERATOR,

        minThreadLockManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
        minThreadPinManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
        minCommentPinManageLevel: NEST_ACCESS_LEVEL.MODERATOR,

        minContentModerateLevel: NEST_ACCESS_LEVEL.MODERATOR,

        minInviteManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
        minMemberRemoveLevel: NEST_ACCESS_LEVEL.MODERATOR,
        minJoinRequestManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
        minBanManageLevel: NEST_ACCESS_LEVEL.MODERATOR,
      },
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

          minThreadCreationLevel: dto.minThreadCreationLevel,
          minCommentCreationLevel: dto.minCommentCreationLevel,

          minNestEditLevel: dto.minNestEditLevel,

          minThreadLockManageLevel: dto.minThreadLockManageLevel,
          minThreadPinManageLevel: dto.minThreadPinManageLevel,
          minCommentPinManageLevel: dto.minCommentPinManageLevel,

          minContentModerateLevel: dto.minContentModerateLevel,
          minMemberViewLevel: dto.minMemberViewLevel,

          minInviteManageLevel: dto.minInviteManageLevel,
          minMemberRemoveLevel: dto.minMemberRemoveLevel,
          minJoinRequestManageLevel: dto.minJoinRequestManageLevel,
          minBanManageLevel: dto.minBanManageLevel,
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
