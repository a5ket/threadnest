import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockUserNestPreferencePolicy } from 'test/factories/user-nest-preference-policy.mock-factory'
import { createMockUserNestPreferenceRepository } from 'test/factories/user-nest-preference-repository.mock-factory'
import { UserNestPreferenceUpdatedEvent } from './events/user-nest-preference-updated.event'
import { UserNestPreferenceService } from './user-nest-preference.service'

describe('UserNestPreferenceService', () => {
  const repo = createMockUserNestPreferenceRepository()
  const nestsRepo = createMockNestRepository()
  const policy = createMockUserNestPreferencePolicy()
  const eventBus = createMockEventBus()

  const service = new UserNestPreferenceService(repo as any, nestsRepo, policy as any, eventBus)

  beforeEach(() => {
    jest.clearAllMocks()
    nestsRepo.getBySlug.mockResolvedValue(createNestSummary({ id: 'nest-1' }))
  })

  describe('get', () => {
    it('returns default preferences when none have been stored yet', async () => {
      repo.getByUserAndNest.mockResolvedValue(null)

      const result = await service.get('user-1', 'nest-slug')

      expect(policy.assertCanManage).toHaveBeenCalledWith('user-1', 'nest-1')
      expect(result).toEqual({ userId: 'user-1', nestId: 'nest-1', allowInvites: true, muted: false })
    })

    it('returns the stored preference when one exists', async () => {
      repo.getByUserAndNest.mockResolvedValue({ userId: 'user-1', nestId: 'nest-1', allowInvites: false, muted: true })

      const result = await service.get('user-1', 'nest-slug')

      expect(result).toEqual({ userId: 'user-1', nestId: 'nest-1', allowInvites: false, muted: true })
    })

    it('propagates the policy failure without reading the preference', async () => {
      policy.assertCanManage.mockRejectedValueOnce(new Error('not a member'))

      await expect(service.get('user-1', 'nest-slug')).rejects.toThrow('not a member')

      expect(repo.getByUserAndNest).not.toHaveBeenCalled()
    })
  })

  describe('update', () => {
    it('falls through to get() when the dto changes nothing', async () => {
      repo.getByUserAndNest.mockResolvedValue({ userId: 'user-1', nestId: 'nest-1', allowInvites: false, muted: true })

      const result = await service.update('user-1', 'nest-slug', {})

      expect(repo.upsert).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
      expect(result).toEqual({ userId: 'user-1', nestId: 'nest-1', allowInvites: false, muted: true })
    })

    it('applies only the provided field, keeping the other from the existing record', async () => {
      repo.getByUserAndNest.mockResolvedValue({ userId: 'user-1', nestId: 'nest-1', allowInvites: false, muted: true })
      repo.upsert.mockResolvedValue({ userId: 'user-1', nestId: 'nest-1', allowInvites: true, muted: true })

      await service.update('user-1', 'nest-slug', { allowInvites: true })

      expect(repo.upsert).toHaveBeenCalledWith('user-1', 'nest-1', true, true)
    })

    it('defaults to allowInvites=true and muted=false when nothing existed before and the dto only sets one field', async () => {
      repo.getByUserAndNest.mockResolvedValue(null)
      repo.upsert.mockResolvedValue({ userId: 'user-1', nestId: 'nest-1', allowInvites: true, muted: true })

      await service.update('user-1', 'nest-slug', { muted: true })

      expect(repo.upsert).toHaveBeenCalledWith('user-1', 'nest-1', true, true)
    })

    it('publishes UserNestPreferenceUpdatedEvent with the resolved values', async () => {
      repo.getByUserAndNest.mockResolvedValue(null)
      repo.upsert.mockResolvedValue({ userId: 'user-1', nestId: 'nest-1', allowInvites: false, muted: true })

      await service.update('user-1', 'nest-slug', { allowInvites: false, muted: true })

      expect(eventBus.publish).toHaveBeenCalledWith(expect.objectContaining({
        props: { userId: 'user-1', nestId: 'nest-1', allowInvites: false, muted: true },
      }))
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserNestPreferenceUpdatedEvent))
    })
  })

  describe('getByUserAndNestId', () => {
    it('delegates directly to the repository, bypassing the slug lookup and policy check', async () => {
      repo.getByUserAndNest.mockResolvedValue({ userId: 'user-1', nestId: 'nest-1', allowInvites: true, muted: false })

      const result = await service.getByUserAndNestId('user-1', 'nest-1')

      expect(repo.getByUserAndNest).toHaveBeenCalledWith('user-1', 'nest-1')
      expect(nestsRepo.getBySlug).not.toHaveBeenCalled()
      expect(policy.assertCanManage).not.toHaveBeenCalled()
      expect(result).toEqual({ userId: 'user-1', nestId: 'nest-1', allowInvites: true, muted: false })
    })
  })
})
