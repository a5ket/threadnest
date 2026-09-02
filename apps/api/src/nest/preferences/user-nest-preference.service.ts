import { Injectable } from '@nestjs/common'
import { EventBus } from 'src/event/event-bus'
import { NestRepository } from '../nest.repository'
import { UserNestPreferenceUpdateDto } from './dto/user-nest-preference.update.dto'
import { UserNestPreferenceRepository } from './user-nest-preference.repository'
import { UserNestPreferencePolicy } from './user-nest-preference.policy'
import { UserNestPreferenceUpdatedEvent } from './events/user-nest-preference-updated.event'

/** A member's per-nest preferences: invite eligibility and mute state. */
@Injectable()
export class UserNestPreferenceService {
  constructor(
    private readonly repo: UserNestPreferenceRepository,
    private readonly nestsRepo: NestRepository,
    private readonly policy: UserNestPreferencePolicy,
    private readonly eventBus: EventBus,
  ) { }

  /**
   * @param userId - The member whose preferences to fetch.
   * @param nestSlug - The nest they're scoped to.
   * @returns The stored preferences, or the defaults (`allowInvites: true`, `muted: false`) if
   * the user has never customized them for this nest.
   * @throws {NestNotFoundException} No nest with this slug.
   * @throws {InsufficientPermissionsException} `userId` isn't a member of the nest.
   */
  async get(userId: string, nestSlug: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.policy.assertCanManage(userId, nest.id)

    const preference = await this.repo.getByUserAndNest(userId, nest.id)

    return preference ?? { userId, nestId: nest.id, allowInvites: true, muted: false }
  }

  /**
   * A no-op update (both fields omitted) is treated as a plain read rather than a write, so it
   * never creates a preference row or publishes a change event for a request that changed
   * nothing. Otherwise, any omitted field falls back to its existing stored value (or the default,
   * if none is stored yet) rather than being reset.
   *
   * @param userId - The member updating their preferences.
   * @param nestSlug - The nest they're scoped to.
   * @param dto - The fields to change; omitted fields are left as-is.
   * @returns The resulting preferences.
   * @throws {NestNotFoundException} No nest with this slug.
   * @throws {InsufficientPermissionsException} `userId` isn't a member of the nest.
   */
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

  /**
   * Currently unused by any caller in this codebase.
   *
   * @param userId - The member whose preferences to fetch.
   * @param nestId - The nest they're scoped to.
   * @returns The stored preferences, or `null` if the user has never customized them for this nest.
   */
  async getByUserAndNestId(userId: string, nestId: string) {
    return this.repo.getByUserAndNest(userId, nestId)
  }
}