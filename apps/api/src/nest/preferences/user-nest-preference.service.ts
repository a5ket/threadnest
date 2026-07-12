import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { NestRepository } from '../nest.repository'
import { UserNestPreferenceUpdateDto } from './dto/user-nest-preference.update.dto'
import { UserNestPreferenceRepository } from './user-nest-preference.repository'
import { UserNestPreferencePolicy } from './user-nest-preference.policy'
import { UserNestPreferenceUpdatedEvent } from './events/user-nest-preference-updated.event'

@Injectable()
export class UserNestPreferenceService {
  constructor(
    private readonly repo: UserNestPreferenceRepository,
    private readonly nestsRepo: NestRepository,
    private readonly policy: UserNestPreferencePolicy,
    private readonly eventBus: EventBus,
  ) { }

  async get(userId: string, nestSlug: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanManage(userId, nest.id)

    const preference = await this.repo.getByUserAndNest(userId, nest.id)

    return preference ?? { userId, nestId: nest.id, allowInvites: true, muted: false }
  }

  async update(userId: string, nestSlug: string, dto: UserNestPreferenceUpdateDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanManage(userId, nest.id)

    if (dto.allowInvites === undefined && dto.muted === undefined) {
      return this.get(userId, nestSlug)
    }

    const existing = await this.repo.getByUserAndNest(userId, nest.id)

    const allowInvites = dto.allowInvites ?? existing?.allowInvites ?? true
    const muted = dto.muted ?? existing?.muted ?? false

    const preference = await this.repo.upsert(userId, nest.id, allowInvites, muted)

    void this.eventBus.publish(new UserNestPreferenceUpdatedEvent({
      userId,
      nestId: nest.id,
      allowInvites,
      muted,
    }))

    return preference
  }

  async getByUserAndNestId(userId: string, nestId: string) {
    return this.repo.getByUserAndNest(userId, nestId)
  }
}