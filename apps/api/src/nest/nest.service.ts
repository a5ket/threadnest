import { Injectable } from '@nestjs/common'
import { randomBytes } from 'crypto'
import { NestMemberRole } from 'generated/prisma/enums'
import { PinoLogger } from 'nestjs-pino'
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

/** Nest lifecycle: creation, metadata/icon updates, ownership transfer, and deletion. */
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
    private readonly imageProcessor: ImageProcessor,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(NestService.name)
  }

  /**
   * Creates the nest, its default settings, and the owner's membership in one transaction.
   *
   * @param actorUserId - Becomes the nest's owner.
   * @param dto - Nest name/slug/visibility/join-policy.
   * @throws {NestSlugReservedException} `dto.slug` is a reserved route name (e.g. `admin`, `api`).
   */
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

    this.logger.info({ nestId: nest.id, slug: nest.slug, ownerId: actorUserId }, 'Nest created')
    void this.eventBus.publish(new NestCreatedEvent({
      nestId: nest.id,
      ownerId: actorUserId,
      slug: nest.slug,
      name: nest.name,
      description: nest.description
    }))

    return this.presenter.toDetailView(nest, access)
  }

  /**
   * @param nestSlug - The nest to look up.
   * @param actorUserId - The viewer, if signed in; determines how much of the nest is visible.
   */
  async getBySlug(nestSlug: string, actorUserId?: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)
    const access = await this.nestAccess.getContext(nest.id, actorUserId)

    return this.presenter.toDetailView(nest, access)
  }

  /**
   * @param query - Search term plus pagination.
   * @param actorUserId - The viewer, if signed in; affects which private nests are included.
   */
  async listDiscoverable(query: NestQueryDto, actorUserId?: string) {
    const page = await this.nestsRepo.listDiscoverable(query, actorUserId)

    return { items: page.items.map((n) => this.presenter.toDiscoveryView(n)), meta: page.meta }
  }

  /**
   * @param nestSlug - The slug to check.
   * @returns `{ available: false }` for a reserved or already-taken slug, `{ available: true }` otherwise.
   */
  async checkSlugAvailability(nestSlug: string) {
    if (RESERVED_NEST_SLUGS.has(nestSlug)) {
      return { available: false }
    }

    const exists = await this.nestsRepo.slugExists(nestSlug)

    return { available: !exists }
  }

  /**
   * @param nestSlug - The nest to update.
   * @param actorUserId - Must be authorized to edit this nest.
   * @param dto - Fields to change; omitted fields are left as-is.
   */
  async update(nestSlug: string, actorUserId: string, dto: NestUpdateDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanUpdateNest(nest, actorUserId)

    const updated = await this.nestsRepo.updateMetadata(nest.id, dto)
    const access = await this.nestAccess.getContext(updated.id, actorUserId)

    void this.eventBus.publish(new NestUpdatedEvent({ nestId: updated.id, userId: actorUserId, name: updated.name, description: updated.description }))

    return this.presenter.toDetailView(updated, access)
  }

  /**
   * Uploads the new icon before deleting the old one, so a failed upload never leaves the nest
   * without an icon.
   *
   * @param nestSlug - The nest to update.
   * @param actorUserId - Must be authorized to edit this nest.
   * @param rawBuffer - The uploaded image, as-is (any format sharp can decode).
   */
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

  /**
   * @param nestSlug - The nest to update.
   * @param actorUserId - Must be authorized to edit this nest.
   */
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

  /**
   * Demotes the current owner to moderator and promotes the target member to owner.
   *
   * @param nestSlug - The nest whose ownership is transferring.
   * @param actorUserId - The current owner.
   * @param dto - The new owner (`userId`), who must already be a member.
   */
  async transferOwnership(nestSlug: string, actorUserId: string, dto: NestTransferOwnershipDto) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanTransferOwnership(nest, actorUserId, dto.userId)

    await this.transactionManager.run(async (tx) => {
      await this.membersRepo.updateRole(nest.id, actorUserId, NestMemberRole.MODERATOR, tx)
      await this.membersRepo.updateRole(nest.id, dto.userId, NestMemberRole.OWNER, tx)
    })

    this.logger.info({ nestId: nest.id, previousOwnerId: actorUserId, newOwnerId: dto.userId }, 'Nest ownership transferred')
    void this.eventBus.publish(new OwnershipTransferredEvent({
      nestId: nest.id,
      nestSlug: nest.slug,
      nestName: nest.name,
      previousOwnerId: actorUserId,
      newOwnerId: dto.userId,
    }))
  }

  /**
   * @param nestSlug - The nest to delete.
   * @param actorUserId - Must be authorized to delete this nest (the owner).
   */
  async delete(nestSlug: string, actorUserId: string) {
    const nest = await this.nestsRepo.getBySlug(nestSlug)

    await this.nestsPolicy.assertCanDeleteNest(nest, actorUserId)
    await this.nestsRepo.delete(nest.id, actorUserId)

    this.logger.info({ nestId: nest.id, actorUserId }, 'Nest deleted')
    void this.eventBus.publish(new NestDeletedEvent({ nestId: nest.id, userId: actorUserId }))
  }
}
