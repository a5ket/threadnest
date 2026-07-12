import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { NestRepository } from '../nest.repository'
import { NestSettingsUpdateDto } from './dto/nest-settings.update.dto'
import { NestSettingsPolicy } from './nest-settings.policy'
import { NestSettingsRepository } from './nest-settings.repository'
import { NestSettingsUpdatedEvent } from './events/nest-settings-updated.event'

@Injectable()
export class NestSettingsService {
  constructor(
    private readonly settingsPolicy: NestSettingsPolicy,
    private readonly settingsRepo: NestSettingsRepository,
    private readonly nestsRepo: NestRepository,
    private readonly eventBus: EventBus,
  ) { }

  async getSettings(nestSlug: string, actorUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.settingsPolicy.assertCanViewSettings(nest.id, actorUserId)

    return this.settingsRepo.get(nest.id)
  }

  async updateSettings(nestSlug: string, actorUserId: string, dto: NestSettingsUpdateDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.settingsPolicy.assertCanUpdateSettings(nest.id, actorUserId)

    const settings = await this.settingsRepo.update(nest.id, dto)

    void this.eventBus.publish(new NestSettingsUpdatedEvent({
      nestId: nest.id,
      userId: actorUserId,
    }))

    return settings
  }
}