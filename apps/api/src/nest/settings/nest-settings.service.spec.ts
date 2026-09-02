import { NestVisibility } from 'generated/prisma/enums'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockLogger } from 'test/factories/logger.mock-factory'
import { createMockNestSettingsPolicy } from 'test/factories/nest-settings-policy.mock-factory'
import { createMockNestSettingsRepository } from 'test/factories/nest-settings-repository.mock-factory'
import { createNestSettings } from 'test/factories/nest-settings.factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { NestSettingsUpdatedEvent } from './events/nest-settings-updated.event'
import { NestSettingsService } from './nest-settings.service'

describe('NestSettingsService', () => {
  const settingsPolicy = createMockNestSettingsPolicy()
  const settingsRepo = createMockNestSettingsRepository()
  const nestsRepo = createMockNestRepository()
  const eventBus = createMockEventBus()
  const logger = createMockLogger()

  const service = new NestSettingsService(settingsPolicy as any, settingsRepo, nestsRepo, eventBus, logger as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getSettings', () => {
    it('returns the settings once the actor is allowed to view them', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const settings = createNestSettings()

      nestsRepo.getBySlug.mockResolvedValue(nest)
      settingsRepo.get.mockResolvedValue(settings)

      const result = await service.getSettings('nest-slug', 'actor-1')

      expect(settingsPolicy.assertCanViewSettings).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(result).toBe(settings)
    })

    it('propagates the policy failure and never queries settings', async () => {
      const nest = createNestSummary()
      settingsPolicy.assertCanViewSettings.mockRejectedValue(new Error('cannot view'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.getSettings('nest-slug', 'actor-1')).rejects.toThrow('cannot view')

      expect(settingsRepo.get).not.toHaveBeenCalled()
    })
  })

  describe('updateSettings', () => {
    it('updates the settings as given when visibility stays public', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const current = createNestSettings({ visibility: NestVisibility.PUBLIC, minThreadCreationLevel: 0, minCommentCreationLevel: 0 })
      const dto = { minThreadCreationLevel: 0 }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      settingsRepo.get.mockResolvedValue(current)
      settingsRepo.update.mockResolvedValue(createNestSettings())

      await service.updateSettings('nest-slug', 'actor-1', dto)

      expect(settingsRepo.update).toHaveBeenCalledWith('nest-1', dto)
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestSettingsUpdatedEvent))
    })

    it('raises non-member participation thresholds to MEMBER when making the nest private', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const current = createNestSettings({ visibility: NestVisibility.PUBLIC, minThreadCreationLevel: 0, minCommentCreationLevel: 0 })
      const dto = { visibility: NestVisibility.PRIVATE }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      settingsRepo.get.mockResolvedValue(current)
      settingsRepo.update.mockResolvedValue(createNestSettings())

      await service.updateSettings('nest-slug', 'actor-1', dto)

      expect(settingsRepo.update).toHaveBeenCalledWith('nest-1', {
        visibility: NestVisibility.PRIVATE,
        minThreadCreationLevel: 10,
        minCommentCreationLevel: 10,
      })
    })

    it('does not lower an already-higher participation threshold when making the nest private', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const current = createNestSettings({ visibility: NestVisibility.PUBLIC, minThreadCreationLevel: 20, minCommentCreationLevel: 20 })
      const dto = { visibility: NestVisibility.PRIVATE }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      settingsRepo.get.mockResolvedValue(current)
      settingsRepo.update.mockResolvedValue(createNestSettings())

      await service.updateSettings('nest-slug', 'actor-1', dto)

      expect(settingsRepo.update).toHaveBeenCalledWith('nest-1', {
        visibility: NestVisibility.PRIVATE,
        minThreadCreationLevel: 20,
        minCommentCreationLevel: 20,
      })
    })

    it('clamps against the already-private current visibility when the dto omits visibility', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const current = createNestSettings({ visibility: NestVisibility.PRIVATE, minThreadCreationLevel: 0, minCommentCreationLevel: 0 })
      const dto = { minThreadCreationLevel: 0 }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      settingsRepo.get.mockResolvedValue(current)
      settingsRepo.update.mockResolvedValue(createNestSettings())

      await service.updateSettings('nest-slug', 'actor-1', dto)

      expect(settingsRepo.update).toHaveBeenCalledWith('nest-1', {
        minThreadCreationLevel: 10,
        minCommentCreationLevel: 10,
      })
    })

    it('propagates the policy failure and never updates settings', async () => {
      const nest = createNestSummary()
      settingsPolicy.assertCanUpdateSettings.mockRejectedValue(new Error('cannot update'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.updateSettings('nest-slug', 'actor-1', {} as any)).rejects.toThrow('cannot update')

      expect(settingsRepo.update).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })
})
