import { Injectable } from '@nestjs/common'
import { NestVisibility } from 'generated/prisma/enums'
import { PinoLogger } from 'nestjs-pino'
import { EventBus } from 'src/event/event-bus'
import { NEST_ACCESS_LEVEL } from '../constants/nest-access-level'
import { NestRepository } from '../nest.repository'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'
import { NestSettingsPolicy } from './nest-settings.policy'
import { NestSettingsRepository } from './nest-settings.repository'
import { NestSettingsUpdatedEvent } from './events/nest-settings-updated.event'

interface NestSettingsParticipationFields {
  visibility: NestVisibility
  minThreadCreationLevel: number
  minCommentCreationLevel: number
}

/** Per-nest configuration: visibility, join policy, and the 15 `min*Level` permission thresholds. */
@Injectable()
export class NestSettingsService {
  constructor(
    private readonly settingsPolicy: NestSettingsPolicy,
    private readonly settingsRepo: NestSettingsRepository,
    private readonly nestsRepo: NestRepository,
    private readonly eventBus: EventBus,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(NestSettingsService.name)
  }

  /**
   * @param nestSlug - The nest to look up.
   * @param actorUserId - Must be authorized to view this nest's settings.
   */
  async getSettings(nestSlug: string, actorUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.settingsPolicy.assertCanViewSettings(nest.id, actorUserId)

    return this.settingsRepo.get(nest.id)
  }

  /**
   * @param nestSlug - The nest to update.
   * @param actorUserId - Must be authorized to update this nest's settings (the owner).
   * @param dto - Fields to change; omitted fields are left as-is. See {@link clampParticipationForPrivacy}
   *   for how switching to `PRIVATE` interacts with participation thresholds.
   */
  async updateSettings(nestSlug: string, actorUserId: string, dto: NestSettingsUpdateDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.settingsPolicy.assertCanUpdateSettings(nest.id, actorUserId)

    const currentSettings = await this.settingsRepo.get(nest.id)
    const clampedDto = this.clampParticipationForPrivacy(dto, currentSettings)

    const settings = await this.settingsRepo.update(nest.id, clampedDto)

    if (clampedDto.visibility && clampedDto.visibility !== currentSettings.visibility) {
      this.logger.info({ nestId: nest.id, actorUserId, visibility: clampedDto.visibility }, 'Nest visibility changed')
    }

    void this.eventBus.publish(new NestSettingsUpdatedEvent({
      nestId: nest.id,
      userId: actorUserId,
    }))

    return settings
  }

  /**
   * A private nest is invisible to non-members, so a non-member participation threshold would
   * be a no-op at best — raise it to `MEMBER` instead of rejecting the update outright.
   *
   * @param dto - The incoming update, possibly changing visibility and/or thresholds.
   * @param current - The nest's settings before this update, used to resolve fields `dto` omits.
   * @returns `dto`, with `minThreadCreationLevel`/`minCommentCreationLevel` raised to at least
   *   `MEMBER` if the resulting visibility is `PRIVATE`.
   */
  private clampParticipationForPrivacy(dto: NestSettingsUpdateDto, current: NestSettingsParticipationFields): NestSettingsUpdateDto {
    const visibility = dto.visibility ?? current.visibility

    if (visibility !== NestVisibility.PRIVATE) {
      return dto
    }

    const minThreadCreationLevel = dto.minThreadCreationLevel ?? current.minThreadCreationLevel
    const minCommentCreationLevel = dto.minCommentCreationLevel ?? current.minCommentCreationLevel

    return {
      ...dto,
      minThreadCreationLevel: Math.max(minThreadCreationLevel, NEST_ACCESS_LEVEL.MEMBER),
      minCommentCreationLevel: Math.max(minCommentCreationLevel, NEST_ACCESS_LEVEL.MEMBER),
    }
  }
}
