import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createUserSuspension } from 'test/factories/user-suspension.factory'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockPlatformUserSuspensionPolicy } from 'test/factories/platform-user-suspension-policy.mock-factory'
import { createMockUserSuspensionPresenter } from 'test/factories/user-suspension-presenter.mock-factory'
import { createMockUserSuspensionService } from 'test/factories/user-suspension-service.mock-factory'
import { PlatformUserSuspensionService } from './platform-user-suspension.service'

describe('PlatformUserSuspensionService', () => {
  const policy = createMockPlatformUserSuspensionPolicy()
  const userSuspensions = createMockUserSuspensionService()
  const presenter = createMockUserSuspensionPresenter()
  const eventBus = createMockEventBus()
  const service = new PlatformUserSuspensionService(policy as any, userSuspensions as any, presenter, eventBus)

  const dto = { reason: 'Spam' }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('suspend', () => {
    it('delegates to the user suspension service and presents the result once the actor is a moderator', async () => {
      const suspension = createUserSuspension()
      const view = { userId: 'user-1' }

      policy.assertIsModerator.mockResolvedValue(undefined)
      userSuspensions.suspend.mockResolvedValue(suspension)
      presenter.toView.mockReturnValue(view as any)

      const result = await service.suspend('user-1', 'mod-1', dto)

      expect(policy.assertIsModerator).toHaveBeenCalledWith('mod-1')
      expect(userSuspensions.suspend).toHaveBeenCalledWith('user-1', 'mod-1', dto)
      expect(presenter.toView).toHaveBeenCalledWith(suspension)
      expect(result).toBe(view)
    })

    it('propagates the permission failure and never delegates', async () => {
      policy.assertIsModerator.mockRejectedValue(new InsufficientPermissionsException())

      await expect(service.suspend('user-1', 'actor-1', dto)).rejects.toThrow(InsufficientPermissionsException)

      expect(userSuspensions.suspend).not.toHaveBeenCalled()
    })
  })

  describe('unsuspend', () => {
    it('delegates to the user suspension service once the actor is a moderator', async () => {
      policy.assertIsModerator.mockResolvedValue(undefined)
      userSuspensions.unsuspend.mockResolvedValue(undefined)

      await service.unsuspend('user-1', 'mod-1')

      expect(policy.assertIsModerator).toHaveBeenCalledWith('mod-1')
      expect(userSuspensions.unsuspend).toHaveBeenCalledWith('user-1', 'mod-1')
    })

    it('propagates the permission failure and never delegates', async () => {
      policy.assertIsModerator.mockRejectedValue(new InsufficientPermissionsException())

      await expect(service.unsuspend('user-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(userSuspensions.unsuspend).not.toHaveBeenCalled()
    })
  })

  describe('getActive', () => {
    it('delegates to the user suspension service and presents the result once the actor is a moderator', async () => {
      const view = { suspended: true, reason: 'Spam' }

      policy.assertIsModerator.mockResolvedValue(undefined)
      userSuspensions.getActive.mockResolvedValue({ reason: 'Spam' })
      presenter.toActiveView.mockReturnValue(view)

      const result = await service.getActive('user-1', 'mod-1')

      expect(policy.assertIsModerator).toHaveBeenCalledWith('mod-1')
      expect(userSuspensions.getActive).toHaveBeenCalledWith('user-1')
      expect(presenter.toActiveView).toHaveBeenCalledWith({ reason: 'Spam' })
      expect(result).toBe(view)
    })

    it('propagates the permission failure and never delegates', async () => {
      policy.assertIsModerator.mockRejectedValue(new InsufficientPermissionsException())

      await expect(service.getActive('user-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(userSuspensions.getActive).not.toHaveBeenCalled()
    })
  })
})
