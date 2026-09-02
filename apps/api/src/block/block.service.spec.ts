import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createBlockedUser } from 'test/factories/blocked-user.factory'
import { createMockBlockPresenter } from 'test/factories/block-presenter.mock-factory'
import { createMockBlockRepository } from 'test/factories/block-repository.mock-factory'
import { createMockUserService } from 'test/factories/user-service.mock-factory'
import { CannotBlockYourselfException } from './exceptions/cannot-block-yourself.exception'
import { UserBlockedEvent } from './events/user-blocked.event'
import { UserUnblockedEvent } from './events/user-unblocked.event'
import { BlockService } from './block.service'

describe('BlockService', () => {
  const repo = createMockBlockRepository()
  const users = createMockUserService()
  const presenter = createMockBlockPresenter()
  const eventBus = createMockEventBus()

  const service = new BlockService(repo as any, users as any, presenter as any, eventBus)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('blockUser', () => {
    it('rejects blocking yourself before checking anything else', async () => {
      await expect(service.blockUser('user-1', 'user-1')).rejects.toThrow(CannotBlockYourselfException)

      expect(users.assertUserExists).not.toHaveBeenCalled()
    })

    it('creates the block and publishes UserBlockedEvent once the target exists', async () => {
      const block = createBlockedUser()
      repo.createAndSelectBlockedUser.mockResolvedValue(block)
      presenter.toView.mockReturnValue({ user: { id: 'user-2' } } as any)

      await service.blockUser('user-1', 'user-2')

      expect(users.assertUserExists).toHaveBeenCalledWith('user-2')
      expect(repo.createAndSelectBlockedUser).toHaveBeenCalledWith('user-1', 'user-2')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserBlockedEvent))
    })

    it('propagates the not-found failure without creating a block', async () => {
      users.assertUserExists.mockRejectedValueOnce(new Error('not found'))

      await expect(service.blockUser('user-1', 'user-2')).rejects.toThrow('not found')

      expect(repo.createAndSelectBlockedUser).not.toHaveBeenCalled()
    })
  })

  describe('exists', () => {
    it('returns false for a user checking a block against themselves, without touching the repository', async () => {
      const result = await service.exists('user-1', 'user-1')

      expect(result).toBe(false)
      expect(repo.exists).not.toHaveBeenCalled()
    })

    it('delegates to the repository for two different users', async () => {
      repo.exists.mockResolvedValue(true)

      const result = await service.exists('user-1', 'user-2')

      expect(repo.exists).toHaveBeenCalledWith('user-1', 'user-2')
      expect(result).toBe(true)
    })
  })

  describe('unblockUser', () => {
    it('deletes the block and publishes UserUnblockedEvent', async () => {
      await service.unblockUser('user-1', 'user-2')

      expect(repo.deleteByUsers).toHaveBeenCalledWith('user-1', 'user-2')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserUnblockedEvent))
    })
  })

  describe('getBlockedUser', () => {
    it('presents the blocked user record', async () => {
      const block = createBlockedUser()
      repo.getBlockedUserById.mockResolvedValue(block)
      presenter.toView.mockReturnValue({ user: { id: 'user-2' } } as any)

      const result = await service.getBlockedUser('user-1', 'user-2')

      expect(presenter.toView).toHaveBeenCalledWith(block)
      expect(result).toEqual({ user: { id: 'user-2' } })
    })
  })

  describe('listBlockedUsers', () => {
    it('presents every blocked user', async () => {
      const blocks = [createBlockedUser({ blocked: { id: 'user-2', profile: null } }), createBlockedUser({ blocked: { id: 'user-3', profile: null } })]
      repo.listBlockedUsers.mockResolvedValue(blocks)
      presenter.toView.mockReturnValue({ user: { id: 'view' } } as any)

      const result = await service.listBlockedUsers('user-1')

      expect(presenter.toView).toHaveBeenCalledTimes(2)
      expect(result).toEqual([{ user: { id: 'view' } }, { user: { id: 'view' } }])
    })
  })
})
