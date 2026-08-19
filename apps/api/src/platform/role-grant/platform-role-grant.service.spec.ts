import { PlatformRole } from 'generated/prisma/enums'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createMockUserService } from 'test/factories/user-service.mock-factory'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockPlatformRoleGrantPolicy } from 'test/factories/platform-role-grant-policy.mock-factory'
import { createMockPlatformRoleGrantPresenter } from 'test/factories/platform-role-grant-presenter.mock-factory'
import { createMockPlatformRoleGrantRepository } from 'test/factories/platform-role-grant-repository.mock-factory'
import { createPlatformRoleGrant } from 'test/factories/platform-role-grant.factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { PlatformRoleGrantService } from './platform-role-grant.service'

describe('PlatformRoleGrantService', () => {
  const user = createMockUserService()
  const roleGrant = createMockPlatformRoleGrantRepository()
  const policy = createMockPlatformRoleGrantPolicy()
  const presenter = createMockPlatformRoleGrantPresenter()
  const transactionManager = createMockTransactionManager()
  const eventBus = createMockEventBus()
  const service = new PlatformRoleGrantService(user as any, roleGrant as any, policy as any, presenter, transactionManager as any, eventBus)

  const dto = { role: PlatformRole.MODERATOR }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('grantRole', () => {
    it('grants a role once the actor is an admin and the target user exists', async () => {
      const grant = createPlatformRoleGrant()
      const view = { userId: 'user-1' }

      policy.assertIsAdmin.mockResolvedValue(undefined)
      user.assertUserExists.mockResolvedValue(undefined)
      roleGrant.create.mockResolvedValue(grant)
      presenter.toView.mockReturnValue(view as any)

      const result = await service.grantRole('user-1', 'admin-1', dto)

      expect(policy.assertIsAdmin).toHaveBeenCalledWith('admin-1')
      expect(user.assertUserExists).toHaveBeenCalledWith('user-1')
      expect(roleGrant.create).toHaveBeenCalledWith('user-1', 'admin-1', dto)
      expect(presenter.toView).toHaveBeenCalledWith(grant)
      expect(result).toBe(view)
    })

    it('propagates the permission failure and never checks the target user or creates a grant', async () => {
      policy.assertIsAdmin.mockRejectedValue(new InsufficientPermissionsException())

      await expect(service.grantRole('user-1', 'actor-1', dto)).rejects.toThrow(InsufficientPermissionsException)

      expect(user.assertUserExists).not.toHaveBeenCalled()
      expect(roleGrant.create).not.toHaveBeenCalled()
    })
  })

  describe('grantRoleBySystemForEmail', () => {
    it('resolves the user by email and creates a grant without an actor', async () => {
      const grant = createPlatformRoleGrant({ grantedById: null })

      user.getByEmail.mockResolvedValue({ id: 'user-1' })
      roleGrant.createWithoutActor.mockResolvedValue(grant)

      const result = await service.grantRoleBySystemForEmail('user@example.com', dto)

      expect(user.getByEmail).toHaveBeenCalledWith('user@example.com')
      expect(roleGrant.createWithoutActor).toHaveBeenCalledWith('user-1', dto)
      expect(result).toBe(grant)
    })
  })

  describe('changeRole', () => {
    it('revokes the current grant and creates the new one atomically once the actor is an admin', async () => {
      const grant = createPlatformRoleGrant({ role: PlatformRole.ADMIN })
      const view = { userId: 'user-1' }

      policy.assertIsAdmin.mockResolvedValue(undefined)
      user.assertUserExists.mockResolvedValue(undefined)
      roleGrant.revoke.mockResolvedValue(undefined)
      roleGrant.create.mockResolvedValue(grant)
      presenter.toView.mockReturnValue(view as any)

      const result = await service.changeRole('user-1', 'admin-1', { role: PlatformRole.ADMIN })

      expect(policy.assertIsAdmin).toHaveBeenCalledWith('admin-1')
      expect(user.assertUserExists).toHaveBeenCalledWith('user-1')
      expect(transactionManager.run).toHaveBeenCalled()
      expect(roleGrant.revoke).toHaveBeenCalledWith('user-1', 'admin-1', expect.anything())
      expect(roleGrant.create).toHaveBeenCalledWith('user-1', 'admin-1', { role: PlatformRole.ADMIN }, expect.anything())
      expect(presenter.toView).toHaveBeenCalledWith(grant)
      expect(result).toBe(view)
    })

    it('propagates the permission failure and never starts a transaction', async () => {
      policy.assertIsAdmin.mockRejectedValue(new InsufficientPermissionsException())

      await expect(service.changeRole('user-1', 'actor-1', dto)).rejects.toThrow(InsufficientPermissionsException)

      expect(transactionManager.run).not.toHaveBeenCalled()
    })

    it('propagates the not-found failure when there is no existing grant to change, and never creates the new one', async () => {
      policy.assertIsAdmin.mockResolvedValue(undefined)
      user.assertUserExists.mockResolvedValue(undefined)
      roleGrant.revoke.mockRejectedValue(new Error('no active grant'))

      await expect(service.changeRole('user-1', 'admin-1', dto)).rejects.toThrow('no active grant')

      expect(roleGrant.create).not.toHaveBeenCalled()
    })
  })

  describe('revokeRole', () => {
    it('revokes the role once the actor is an admin', async () => {
      policy.assertIsAdmin.mockResolvedValue(undefined)
      roleGrant.revoke.mockResolvedValue(undefined)

      await service.revokeRole('user-1', 'admin-1')

      expect(policy.assertIsAdmin).toHaveBeenCalledWith('admin-1')
      expect(roleGrant.revoke).toHaveBeenCalledWith('user-1', 'admin-1')
    })

    it('propagates the permission failure and never revokes', async () => {
      policy.assertIsAdmin.mockRejectedValue(new InsufficientPermissionsException())

      await expect(service.revokeRole('user-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(roleGrant.revoke).not.toHaveBeenCalled()
    })
  })

  describe('getActiveRole', () => {
    it('returns the active role once the actor is an admin', async () => {
      const view = { role: PlatformRole.MODERATOR }

      policy.assertIsAdmin.mockResolvedValue(undefined)
      roleGrant.getActiveRole.mockResolvedValue(PlatformRole.MODERATOR)
      presenter.toActiveRoleView.mockReturnValue(view)

      const result = await service.getActiveRole('user-1', 'admin-1')

      expect(policy.assertIsAdmin).toHaveBeenCalledWith('admin-1')
      expect(roleGrant.getActiveRole).toHaveBeenCalledWith('user-1')
      expect(presenter.toActiveRoleView).toHaveBeenCalledWith(PlatformRole.MODERATOR)
      expect(result).toBe(view)
    })

    it('propagates the permission failure and never queries the grant', async () => {
      policy.assertIsAdmin.mockRejectedValue(new InsufficientPermissionsException())

      await expect(service.getActiveRole('user-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(roleGrant.getActiveRole).not.toHaveBeenCalled()
    })
  })
})
