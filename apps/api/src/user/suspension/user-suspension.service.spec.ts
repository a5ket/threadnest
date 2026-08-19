import { createMockUserService } from 'test/factories/user-service.mock-factory'
import { createMockUserSuspensionRepository } from 'test/factories/user-suspension-repository.mock-factory'
import { createUserSuspension } from 'test/factories/user-suspension.factory'
import { CannotSuspendYourselfException } from './exceptions/cannot-suspend-yourself.exception'
import { UserSuspensionService } from './user-suspension.service'

describe('UserSuspensionService', () => {
  const user = createMockUserService()
  const suspensions = createMockUserSuspensionRepository()
  const service = new UserSuspensionService(user as any, suspensions as any)

  const dto = { reason: 'Spam' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('suspend', () => {
    it('suspends once the target user exists', async () => {
      const suspension = createUserSuspension()

      user.assertUserExists.mockResolvedValue(undefined)
      suspensions.create.mockResolvedValue(suspension)

      const result = await service.suspend('user-1', 'mod-1', dto)

      expect(user.assertUserExists).toHaveBeenCalledWith('user-1')
      expect(suspensions.create).toHaveBeenCalledWith('user-1', 'mod-1', dto)
      expect(result).toBe(suspension)
    })

    it('throws CannotSuspendYourselfException when the actor targets their own account, before checking the target exists', async () => {
      await expect(service.suspend('actor-1', 'actor-1', dto)).rejects.toThrow(CannotSuspendYourselfException)

      expect(user.assertUserExists).not.toHaveBeenCalled()
      expect(suspensions.create).not.toHaveBeenCalled()
    })
  })

  describe('unsuspend', () => {
    it('revokes the suspension', async () => {
      suspensions.revoke.mockResolvedValue(undefined)

      await service.unsuspend('user-1', 'mod-1')

      expect(suspensions.revoke).toHaveBeenCalledWith('user-1', 'mod-1')
    })
  })

  describe('getActive', () => {
    it('returns the active suspension', async () => {
      suspensions.getActive.mockResolvedValue({ reason: 'Spam' })

      const result = await service.getActive('user-1')

      expect(suspensions.getActive).toHaveBeenCalledWith('user-1')
      expect(result).toEqual({ reason: 'Spam' })
    })
  })
})
