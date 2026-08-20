import { Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { NestMemberRole } from 'generated/prisma/enums'
import { EventBus } from 'src/event/event-bus'
import { TransactionManager } from 'src/prisma/transaction-manager'
import { ImageProcessor } from 'src/storage/image-processor'
import { StorageService } from 'src/storage/storage.service'
import { RESERVED_NEST_SLUGS } from './constants/reserved-nest-slugs'
import { NestSlugReservedException } from './exceptions/nest-slug-reserved.exception'
import { NestCreateDto } from './dto/nest.create.dto'
import { NestQueryDto } from './dto/nest.query.dto'
import { NestTransferOwnershipDto } from './dto/nest.transfer-ownership.dto'
import { NestUpdateDto } from './dto/nest.update.dto'
import { NestCreatedEvent } from './events/nest-created.event'
import { NestDeletedEvent } from './events/nest-deleted.event'
import { NestUpdatedEvent } from './events/nest-updated.event'
import { OwnershipTransferredEvent } from './events/ownership-transferred.event'
import { NestMemberRepository } from './member/nest-member.repository'
import { NestAccess } from './nest.access'
import { NestPresenter } from './nest.presenter'
import { NestPolicy } from './nest.policy'
import { NestRepository } from './nest.repository'
import { NestSettingsRepository } from './settings/nest-settings.repository'

const NEST_ICON_SIZE = 256

@Injectable()
export class NestService {
  constructor(
    private readonly nestsRepo: NestRepository,
    private readonly membersRepo: NestMemberRepository,
    private readonly settingsRepo: NestSettingsRepository,
    private readonly nestsPolicy: NestPolicy,
    private readonly nestAccess: NestAccess,
    private readonly presenter: NestPresenter,
    private readonly transactionManager: TransactionManager,
    private readonly eventBus: EventBus,
    private readonly storage: StorageService,
    private readonly imageProcessor: ImageProcessor
  ) { }

  async create(actorUserId: string, dto: NestCreateDto) {
    if (RESERVED_NEST_SLUGS.has(dto.slug)) {
      throw new NestSlugReservedException()
    }

    await this.nestsPolicy.assertCanCreateNest(actorUserId)

    const nest = await this.transactionManager.run(async (tx) => {
      const nest = await this.nestsRepo.create(dto, tx)

      await this.settingsRepo.create(nest.id, { visibility: dto.visibility, joinPolicy: dto.joinPolicy }, tx)
      await this.membersRepo.createOwner(nest.id, actorUserId, tx)

      return nest
    })

    const access = await this.nestAccess.getContext(nest.id, actorUserId)

    void this.eventBus.publish(new NestCreatedEvent({
      nestId: nest.id,
      ownerId: actorUserId,
      slug: nest.slug,
      name: nest.name,
      description: nest.description
    }))

    return this.presenter.toDetailView(nest, access)
  }

  async getBySlug(nestSlug: string, actorUserId?: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    const access = await this.nestAccess.getContext(nest.id, actorUserId)

    return this.presenter.toDetailView(nest, access)
  }

  async listDiscoverable(query: NestQueryDto, actorUserId?: string) {
    const page = await this.nestsRepo.listDiscoverable(query, actorUserId)

    return { items: page.items.map((n) => this.presenter.toDiscoveryView(n)), meta: page.meta }
  }

  async checkSlugAvailability(nestSlug: string) {
    if (RESERVED_NEST_SLUGS.has(nestSlug)) {
      return { available: false }
    }

    const exists = await this.nestsRepo.slugExists(nestSlug)

    return { available: !exists }
  }

  async update(nestSlug: string, actorUserId: string, dto: NestUpdateDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanUpdateNest(nest, actorUserId)

    const updated = await this.nestsRepo.updateMetadata(nest.id, dto)
    const access = await this.nestAccess.getContext(updated.id, actorUserId)

    void this.eventBus.publish(new NestUpdatedEvent({ nestId: updated.id, userId: actorUserId, name: updated.name, description: updated.description }))

    return this.presenter.toDetailView(updated, access)
  }

  async updateIcon(nestSlug: string, actorUserId: string, rawBuffer: Buffer) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanUpdateNest(nest, actorUserId)

    const processed = await this.imageProcessor.toSquareWebp(rawBuffer, NEST_ICON_SIZE)
    const key = `nests/${nest.id}/${randomBytes(8).toString('hex')}.webp`

    await this.storage.upload(key, processed, 'image/webp')
    const updated = await this.nestsRepo.updateIconKey(nest.id, key)

    if (nest.iconKey) {
      await this.storage.delete(nest.iconKey)
    }

    const access = await this.nestAccess.getContext(updated.id, actorUserId)
    return this.presenter.toDetailView(updated, access)
  }

  async removeIcon(nestSlug: string, actorUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanUpdateNest(nest, actorUserId)

    const updated = await this.nestsRepo.updateIconKey(nest.id, null)

    if (nest.iconKey) {
      await this.storage.delete(nest.iconKey)
    }

    const access = await this.nestAccess.getContext(updated.id, actorUserId)
    return this.presenter.toDetailView(updated, access)
  }

  async transferOwnership(nestSlug: string, actorUserId: string, dto: NestTransferOwnershipDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanTransferOwnership(nest, actorUserId, dto.userId)

    await this.transactionManager.run(async (tx) => {
      await this.membersRepo.updateRole(nest.id, actorUserId, NestMemberRole.MODERATOR, tx)
      await this.membersRepo.updateRole(nest.id, dto.userId, NestMemberRole.OWNER, tx)
    })

    void this.eventBus.publish(new OwnershipTransferredEvent({
      nestId: nest.id,
      nestSlug: nest.slug,
      nestName: nest.name,
      previousOwnerId: actorUserId,
      newOwnerId: dto.userId,
    }))
  }

  async delete(nestSlug: string, actorUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanDeleteNest(nest, actorUserId)
    await this.nestsRepo.delete(nest.id, actorUserId)
    void this.eventBus.publish(new NestDeletedEvent({ nestId: nest.id, userId: actorUserId }))
  }
}
