import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockLogger } from 'test/factories/logger.mock-factory'
import { createMockNestBanPolicy } from 'test/factories/nest-ban-policy.mock-factory'
import { createMockNestBanPresenter } from 'test/factories/nest-ban-presenter.mock-factory'
import { createMockNestBanRepository } from 'test/factories/nest-ban-repository.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { UserBannedEvent } from './events/user-banned.event'
import { UserUnbannedEvent } from './events/user-unbanned.event'
import { NestBanService } from './nest-ban.service'

describe('NestBanService', () => {
  const policy = createMockNestBanPolicy()
  const bansRepo = createMockNestBanRepository()
  const nestsRepo = createMockNestRepository()
  const membersRepo = createMockNestMemberRepository()
  const presenter = createMockNestBanPresenter()
  const transactions = createMockTransactionManager()
  const eventBus = createMockEventBus()
  const logger = createMockLogger()

  const service = new NestBanService(
    policy as any,
    bansRepo as any,
    nestsRepo,
    membersRepo,
    presenter as any,
    transactions as any,
    eventBus,
    logger as any,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    membersRepo.deleteIfExistsByUserId.mockResolvedValue({ count: 0 })
  })

  describe('banUser', () => {
    it('creates the ban and publishes UserBannedEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1', slug: 'nest-slug', name: 'Nest' })
      const ban = { reason: null }
      const view = { id: 'view-1' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      bansRepo.create.mockResolvedValue(ban as any)
      presenter.toSummaryView.mockReturnValue(view as any)

      const result = await service.banUser('nest-slug', 'actor-1', 'target-1')

      expect(policy.assertCanBanUser).toHaveBeenCalledWith('nest-1', 'actor-1', 'target-1')
      expect(bansRepo.create).toHaveBeenCalledWith('nest-1', 'target-1', 'actor-1', {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserBannedEvent))
      expect(result).toBe(view)
    })

    it('drops the member count when the banned user was still a member', async () => {
      const nest = createNestSummary({ id: 'nest-1' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      bansRepo.create.mockResolvedValue({ reason: null } as any)
      membersRepo.deleteIfExistsByUserId.mockResolvedValue({ count: 1 })

      await service.banUser('nest-slug', 'actor-1', 'target-1')

      expect(nestsRepo.adjustMemberCount).toHaveBeenCalledWith('nest-1', -1, {})
    })

    it('does not touch the member count when the banned user was never a member', async () => {
      const nest = createNestSummary({ id: 'nest-1' })

      nestsRepo.getBySlug.mockResolvedValue(nest)
      bansRepo.create.mockResolvedValue({ reason: null } as any)
      membersRepo.deleteIfExistsByUserId.mockResolvedValue({ count: 0 })

      await service.banUser('nest-slug', 'actor-1', 'target-1')

      expect(nestsRepo.adjustMemberCount).not.toHaveBeenCalled()
    })

    it('propagates the policy failure and never creates a ban', async () => {
      const nest = createNestSummary()
      policy.assertCanBanUser.mockRejectedValue(new Error('cannot ban'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.banUser('nest-slug', 'actor-1', 'target-1')).rejects.toThrow('cannot ban')

      expect(bansRepo.create).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  describe('unbanUser', () => {
    it('revokes the ban and publishes UserUnbannedEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await service.unbanUser('nest-slug', 'actor-1', 'target-1')

      expect(policy.assertCanUnbanUser).toHaveBeenCalledWith('nest-1', 'actor-1', 'target-1')
      expect(bansRepo.revoke).toHaveBeenCalledWith('nest-1', 'target-1', 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(UserUnbannedEvent))
    })

    it('propagates the policy failure and never revokes the ban', async () => {
      const nest = createNestSummary()
      policy.assertCanUnbanUser.mockRejectedValue(new Error('cannot unban'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.unbanUser('nest-slug', 'actor-1', 'target-1')).rejects.toThrow('cannot unban')

      expect(bansRepo.revoke).not.toHaveBeenCalled()
    })
  })

  describe('listBans', () => {
    it('lists bans for the nest once the actor is allowed to view them', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const bans = [{ reason: null }, { reason: 'spam' }]
      const view = { id: 'view' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      bansRepo.listSummaryByNestId.mockResolvedValue(bans as any)
      presenter.toSummaryView.mockReturnValue(view as any)

      const result = await service.listBans('nest-slug', 'actor-1')

      expect(policy.assertCanViewBans).toHaveBeenCalledWith('nest-1', 'actor-1')
      expect(presenter.toSummaryView).toHaveBeenCalledTimes(2)
      expect(result).toEqual([view, view])
    })

    it('propagates the policy failure and never queries bans', async () => {
      const nest = createNestSummary()
      policy.assertCanViewBans.mockRejectedValue(new Error('cannot view bans'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.listBans('nest-slug', 'actor-1')).rejects.toThrow('cannot view bans')

      expect(bansRepo.listSummaryByNestId).not.toHaveBeenCalled()
    })
  })
})
