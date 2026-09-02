import { createMockUserPreferenceRepository } from 'test/factories/user-preference-repository.mock-factory'
import { UserPreferenceService } from './user-preference.service'

describe('UserPreferenceService', () => {
  const repo = createMockUserPreferenceRepository()
  const service = new UserPreferenceService(repo as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('get', () => {
    it('returns a default preference (activity visible) when none has been stored yet', async () => {
      repo.getByUserId.mockResolvedValue(null)

      const result = await service.get('user-1')

      expect(result).toEqual({ userId: 'user-1', showActivityOnProfile: true })
    })

    it('returns the stored preference when one exists', async () => {
      repo.getByUserId.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      const result = await service.get('user-1')

      expect(result).toEqual({ userId: 'user-1', showActivityOnProfile: false })
    })
  })

  describe('update', () => {
    it('falls through to get() when the dto does not set showActivityOnProfile', async () => {
      repo.getByUserId.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      const result = await service.update('user-1', {})

      expect(repo.upsert).not.toHaveBeenCalled()
      expect(result).toEqual({ userId: 'user-1', showActivityOnProfile: false })
    })

    it('upserts the explicitly provided value', async () => {
      repo.getByUserId.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })
      repo.upsert.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      await service.update('user-1', { showActivityOnProfile: false })

      expect(repo.upsert).toHaveBeenCalledWith('user-1', false)
    })

    it('upserts the provided value even when no preference existed before', async () => {
      repo.getByUserId.mockResolvedValue(null)
      repo.upsert.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      await service.update('user-1', { showActivityOnProfile: false })

      expect(repo.upsert).toHaveBeenCalledWith('user-1', false)
    })
  })
})
