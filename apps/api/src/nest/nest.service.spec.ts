import { NestMemberRole, NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockImageProcessor } from 'test/factories/image-processor.mock-factory'
import { createMockLogger } from 'test/factories/logger.mock-factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createMockNestPolicy } from 'test/factories/nest-policy.mock-factory'
import { createMockNestPresenter } from 'test/factories/nest-presenter.mock-factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createMockNestSettingsRepository } from 'test/factories/nest-settings-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { NestCreatedEvent } from './events/nest-created.event'
import { NestDeletedEvent } from './events/nest-deleted.event'
import { NestUpdatedEvent } from './events/nest-updated.event'
import { OwnershipTransferredEvent } from './events/ownership-transferred.event'
import { NestSlugReservedException } from './exceptions/nest-slug-reserved.exception'
import { NestService } from './nest.service'

describe('NestService', () => {
  const nestsRepo = createMockNestRepository()
  const membersRepo = createMockNestMemberRepository()
  const settingsRepo = createMockNestSettingsRepository()
  const nestsPolicy = createMockNestPolicy()
  const nestAccess = createMockNestAccess()
  const presenter = createMockNestPresenter()
  const transactionManager = createMockTransactionManager()
  const eventBus = createMockEventBus()
  const storage = createMockStorageService()
  const imageProcessor = createMockImageProcessor()
  const logger = createMockLogger()

  const service = new NestService(
    nestsRepo,
    membersRepo,
    settingsRepo,
    nestsPolicy as any,
    nestAccess as any,
    presenter as any,
    transactionManager as any,
    eventBus,
    storage as any,
    imageProcessor,
    logger as any,
  )

  const createDto = { name: 'Nest', slug: 'nest-slug', visibility: NestVisibility.PUBLIC, joinPolicy: NestJoinPolicy.OPEN }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('throws NestSlugReservedException for a reserved slug and never checks the policy', async () => {
      await expect(service.create('actor-1', { ...createDto, slug: 'admin' })).rejects.toThrow(NestSlugReservedException)

      expect(nestsPolicy.assertCanCreateNest).not.toHaveBeenCalled()
    })

    it('creates the nest, its settings, and its owner membership once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1', slug: 'nest-slug' })
      const access = createNestAccessContext()
      const view = { id: 'view-1' }

      nestsRepo.create.mockResolvedValue(nest)
      nestAccess.getContext.mockResolvedValue(access)
      presenter.toDetailView.mockReturnValue(view as any)

      const result = await service.create('actor-1', createDto)

      expect(nestsPolicy.assertCanCreateNest).toHaveBeenCalledWith('actor-1')
      expect(nestsRepo.create).toHaveBeenCalledWith(createDto, {})
      expect(settingsRepo.create).toHaveBeenCalledWith('nest-1', { visibility: createDto.visibility, joinPolicy: createDto.joinPolicy }, {})
      expect(membersRepo.createOwner).toHaveBeenCalledWith('nest-1', 'actor-1', {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestCreatedEvent))
      expect(result).toBe(view)
    })

    it('propagates the policy failure and never creates the nest', async () => {
      nestsPolicy.assertCanCreateNest.mockRejectedValue(new Error('cannot create'))

      await expect(service.create('actor-1', createDto)).rejects.toThrow('cannot create')

      expect(nestsRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('getBySlug', () => {
    it('resolves the nest and presents it with the viewer\'s access context', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const access = createNestAccessContext()
      const view = { id: 'view-1' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      nestAccess.getContext.mockResolvedValue(access)
      presenter.toDetailView.mockReturnValue(view as any)

      const result = await service.getBySlug('nest-slug', 'actor-1')

      expect(nestAccess.getContext).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(result).toBe(view)
    })
  })

  describe('checkSlugAvailability', () => {
    it('reports a reserved slug as unavailable without querying the repository', async () => {
      const result = await service.checkSlugAvailability('admin')

      expect(result).toEqual({ available: false })
      expect(nestsRepo.slugExists).not.toHaveBeenCalled()
    })

    it('reports availability based on the repository when not reserved', async () => {
      nestsRepo.slugExists.mockResolvedValue(true)

      const result = await service.checkSlugAvailability('taken-slug')

      expect(result).toEqual({ available: false })
    })

    it('reports a free slug as available', async () => {
      nestsRepo.slugExists.mockResolvedValue(false)

      const result = await service.checkSlugAvailability('free-slug')

      expect(result).toEqual({ available: true })
    })
  })

  describe('update', () => {
    it('updates the nest and publishes NestUpdatedEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const updated = createNestSummary({ id: 'nest-1', name: 'New name' })
      const access = createNestAccessContext()
      const view = { id: 'view-1' }
      const dto = { name: 'New name' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      nestsRepo.updateMetadata.mockResolvedValue(updated)
      nestAccess.getContext.mockResolvedValue(access)
      presenter.toDetailView.mockReturnValue(view as any)

      const result = await service.update('nest-slug', 'actor-1', dto)

      expect(nestsPolicy.assertCanUpdateNest).toHaveBeenCalledWith(nest, 'actor-1')
      expect(nestsRepo.updateMetadata).toHaveBeenCalledWith('nest-1', dto)
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestUpdatedEvent))
      expect(result).toBe(view)
    })

    it('propagates the policy failure and never updates the nest', async () => {
      const nest = createNestSummary()
      nestsPolicy.assertCanUpdateNest.mockRejectedValueOnce(new Error('cannot update'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.update('nest-slug', 'actor-1', {} as any)).rejects.toThrow('cannot update')

      expect(nestsRepo.updateMetadata).not.toHaveBeenCalled()
    })
  })

  describe('updateIcon', () => {
    it('uploads the processed image, updates the icon key, and deletes the old icon when one existed', async () => {
      const nest = createNestSummary({ id: 'nest-1', iconKey: 'old-key.webp' })
      const updated = createNestSummary({ id: 'nest-1', iconKey: 'new-key.webp' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      nestsRepo.updateIconKey.mockResolvedValue(updated)
      nestAccess.getContext.mockResolvedValue(createNestAccessContext())
      presenter.toDetailView.mockReturnValue({ id: 'view' } as any)

      await service.updateIcon('nest-slug', 'actor-1', Buffer.from('raw'))

      expect(imageProcessor.toSquareWebp).toHaveBeenCalledWith(Buffer.from('raw'), 256)
      expect(storage.upload).toHaveBeenCalled()
      expect(storage.delete).toHaveBeenCalledWith('old-key.webp')
    })

    it('does not attempt to delete an icon when the nest had none', async () => {
      const nest = createNestSummary({ id: 'nest-1', iconKey: null })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      nestsRepo.updateIconKey.mockResolvedValue(nest)
      nestAccess.getContext.mockResolvedValue(createNestAccessContext())
      presenter.toDetailView.mockReturnValue({ id: 'view' } as any)

      await service.updateIcon('nest-slug', 'actor-1', Buffer.from('raw'))

      expect(storage.delete).not.toHaveBeenCalled()
    })

    it('propagates the policy failure and never uploads', async () => {
      const nest = createNestSummary()
      nestsPolicy.assertCanUpdateNest.mockRejectedValueOnce(new Error('cannot update icon'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.updateIcon('nest-slug', 'actor-1', Buffer.from('raw'))).rejects.toThrow('cannot update icon')

      expect(storage.upload).not.toHaveBeenCalled()
    })
  })

  describe('removeIcon', () => {
    it('clears the icon key and deletes the stored file when one existed', async () => {
      const nest = createNestSummary({ id: 'nest-1', iconKey: 'old-key.webp' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      nestsRepo.updateIconKey.mockResolvedValue(createNestSummary({ iconKey: null }))
      nestAccess.getContext.mockResolvedValue(createNestAccessContext())
      presenter.toDetailView.mockReturnValue({ id: 'view' } as any)

      await service.removeIcon('nest-slug', 'actor-1')

      expect(nestsRepo.updateIconKey).toHaveBeenCalledWith('nest-1', null)
      expect(storage.delete).toHaveBeenCalledWith('old-key.webp')
    })
  })

  describe('transferOwnership', () => {
    it('demotes the actor to moderator, promotes the target to owner, and publishes OwnershipTransferredEvent', async () => {
      const nest = createNestSummary({ id: 'nest-1', slug: 'nest-slug', name: 'Nest' })
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await service.transferOwnership('nest-slug', 'actor-1', { userId: 'target-1' })

      expect(nestsPolicy.assertCanTransferOwnership).toHaveBeenCalledWith(nest, 'actor-1', 'target-1')
      expect(membersRepo.updateRole).toHaveBeenCalledWith('nest-1', 'actor-1', NestMemberRole.MODERATOR, {})
      expect(membersRepo.updateRole).toHaveBeenCalledWith('nest-1', 'target-1', NestMemberRole.OWNER, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(OwnershipTransferredEvent))
    })

    it('propagates the policy failure and never changes roles', async () => {
      const nest = createNestSummary()
      nestsPolicy.assertCanTransferOwnership.mockRejectedValue(new Error('cannot transfer'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.transferOwnership('nest-slug', 'actor-1', { userId: 'target-1' })).rejects.toThrow('cannot transfer')

      expect(membersRepo.updateRole).not.toHaveBeenCalled()
    })
  })

  describe('delete', () => {
    it('deletes the nest and publishes NestDeletedEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await service.delete('nest-slug', 'actor-1')

      expect(nestsPolicy.assertCanDeleteNest).toHaveBeenCalledWith(nest, 'actor-1')
      expect(nestsRepo.delete).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestDeletedEvent))
    })

    it('propagates the policy failure and never deletes the nest', async () => {
      const nest = createNestSummary()
      nestsPolicy.assertCanDeleteNest.mockRejectedValue(new Error('cannot delete'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.delete('nest-slug', 'actor-1')).rejects.toThrow('cannot delete')

      expect(nestsRepo.delete).not.toHaveBeenCalled()
    })
  })
})
