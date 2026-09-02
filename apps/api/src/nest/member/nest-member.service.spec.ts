import { NestMemberRole } from 'generated/prisma/enums'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockLogger } from 'test/factories/logger.mock-factory'
import { createNestMember } from 'test/factories/nest-member.factory'
import { createMockNestMemberPolicy } from 'test/factories/nest-member-policy.mock-factory'
import { createMockNestMemberPresenter } from 'test/factories/nest-member-presenter.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createMockNestPresenter } from 'test/factories/nest-presenter.mock-factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { MemberJoinedEvent } from './events/member-joined.event'
import { MemberLeftEvent } from './events/member-left.event'
import { MemberRemovedEvent } from './events/member-removed.event'
import { MemberRoleChangedEvent } from './events/member-role-changed.event'
import { NestMemberService } from './nest-member.service'

describe('NestMemberService', () => {
  const membersRepo = createMockNestMemberRepository()
  const nestsRepo = createMockNestRepository()
  const policy = createMockNestMemberPolicy()
  const presenter = createMockNestPresenter()
  const memberPresenter = createMockNestMemberPresenter()
  const transactionManager = createMockTransactionManager()
  const eventBus = createMockEventBus()
  const logger = createMockLogger()

  const service = new NestMemberService(
    membersRepo,
    nestsRepo,
    policy as any,
    presenter as any,
    memberPresenter as any,
    transactionManager as any,
    eventBus,
    logger as any,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('joinNest', () => {
    it('creates the membership, bumps the member count, and publishes MemberJoinedEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const member = createNestMember({ nestId: 'nest-1', userId: 'user-1' })
      const view = { id: 'view-1' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      membersRepo.createMember.mockResolvedValue(member)
      memberPresenter.toView.mockReturnValue(view as any)

      const result = await service.joinNest('nest-slug', 'user-1')

      expect(policy.assertCanJoinNest).toHaveBeenCalledWith(nest, 'user-1')
      expect(membersRepo.createMember).toHaveBeenCalledWith('nest-1', 'user-1', {})
      expect(nestsRepo.adjustMemberCount).toHaveBeenCalledWith('nest-1', 1, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(MemberJoinedEvent))
      expect(result).toBe(view)
    })

    it('propagates the policy failure and never creates a membership', async () => {
      const nest = createNestSummary()
      policy.assertCanJoinNest.mockRejectedValue(new Error('cannot join'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.joinNest('nest-slug', 'user-1')).rejects.toThrow('cannot join')

      expect(membersRepo.createMember).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  describe('leaveNest', () => {
    it('deletes the membership, drops the member count, and publishes MemberLeftEvent', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await service.leaveNest('nest-slug', 'user-1')

      expect(policy.assertCanLeaveNest).toHaveBeenCalledWith(nest, 'user-1')
      expect(membersRepo.deleteByUserId).toHaveBeenCalledWith('nest-1', 'user-1', {})
      expect(nestsRepo.adjustMemberCount).toHaveBeenCalledWith('nest-1', -1, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(MemberLeftEvent))
    })

    it('propagates the policy failure and never deletes the membership', async () => {
      const nest = createNestSummary()
      policy.assertCanLeaveNest.mockRejectedValue(new Error('cannot leave'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.leaveNest('nest-slug', 'user-1')).rejects.toThrow('cannot leave')

      expect(membersRepo.deleteByUserId).not.toHaveBeenCalled()
    })
  })

  describe('removeMember', () => {
    it('removes the target member, drops the member count, and publishes MemberRemovedEvent', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await service.removeMember('nest-slug', 'actor-1', 'target-1')

      expect(policy.assertCanRemoveMember).toHaveBeenCalledWith(nest, 'actor-1', 'target-1')
      expect(membersRepo.deleteByUserId).toHaveBeenCalledWith('nest-1', 'target-1', {})
      expect(nestsRepo.adjustMemberCount).toHaveBeenCalledWith('nest-1', -1, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(MemberRemovedEvent))
    })

    it('propagates the policy failure and never removes the member', async () => {
      const nest = createNestSummary()
      policy.assertCanRemoveMember.mockRejectedValue(new Error('cannot remove'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.removeMember('nest-slug', 'actor-1', 'target-1')).rejects.toThrow('cannot remove')

      expect(membersRepo.deleteByUserId).not.toHaveBeenCalled()
    })
  })

  describe('changeRole', () => {
    it('updates the role and publishes MemberRoleChangedEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const updated = createNestMember({ nestId: 'nest-1', userId: 'target-1', role: NestMemberRole.MODERATOR })
      const view = { id: 'view-1' }
      const dto = { role: NestMemberRole.MODERATOR }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      membersRepo.updateRole.mockResolvedValue(updated)
      memberPresenter.toView.mockReturnValue(view as any)

      const result = await service.changeRole('nest-slug', 'actor-1', 'target-1', dto)

      expect(policy.assertCanChangeRole).toHaveBeenCalledWith(nest, 'actor-1', 'target-1', dto.role)
      expect(membersRepo.updateRole).toHaveBeenCalledWith('nest-1', 'target-1', dto.role)
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(MemberRoleChangedEvent))
      expect(result).toBe(view)
    })

    it('propagates the policy failure and never updates the role', async () => {
      const nest = createNestSummary()
      policy.assertCanChangeRole.mockRejectedValue(new Error('cannot change role'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(
        service.changeRole('nest-slug', 'actor-1', 'target-1', { role: NestMemberRole.MODERATOR }),
      ).rejects.toThrow('cannot change role')

      expect(membersRepo.updateRole).not.toHaveBeenCalled()
    })
  })

  describe('listMembers', () => {
    it('lists members for the nest once the actor is allowed to view them', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const members = [createNestMember({ userId: 'user-1' }), createNestMember({ userId: 'user-2' })]
      const view = { id: 'view' }

      nestsRepo.getBySlug.mockResolvedValue(nest)
      membersRepo.listByNestId.mockResolvedValue({ items: members, meta: { nextCursor: null, hasMore: false } })
      memberPresenter.toView.mockReturnValue(view as any)

      const result = await service.listMembers('nest-slug', 'actor-1', {} as any)

      expect(policy.assertCanListMembers).toHaveBeenCalledWith(nest, 'actor-1')
      expect(memberPresenter.toView).toHaveBeenCalledTimes(2)
      expect(result.items).toEqual([view, view])
    })

    it('propagates the policy failure and never queries members', async () => {
      const nest = createNestSummary()
      policy.assertCanListMembers.mockRejectedValue(new Error('cannot list'))
      nestsRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.listMembers('nest-slug', 'actor-1', {} as any)).rejects.toThrow('cannot list')

      expect(membersRepo.listByNestId).not.toHaveBeenCalled()
    })
  })

  describe('getMembershipByUser', () => {
    it('resolves the nest then looks up the membership', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const member = createNestMember()

      nestsRepo.getBySlug.mockResolvedValue(nest)
      membersRepo.getByUser.mockResolvedValue(member)

      const result = await service.getMembershipByUser('nest-slug', 'user-1')

      expect(membersRepo.getByUser).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(result).toBe(member)
    })
  })

  describe('listNestsByUser', () => {
    it('presents each membership\'s nest as a summary view', async () => {
      const nest = createNestSummary()
      membersRepo.listMembershipsByUser.mockResolvedValue([{ nest }] as any)
      presenter.toSummaryView.mockReturnValue({ id: 'summary' } as any)

      const result = await service.listNestsByUser('user-1')

      expect(presenter.toSummaryView).toHaveBeenCalledWith(nest)
      expect(result).toEqual([{ id: 'summary' }])
    })
  })

  describe('listMembershipReferencesByUser', () => {
    it('presents each membership\'s nest as a reference view', async () => {
      const nest = createNestSummary()
      membersRepo.listMembershipReferencesByUser.mockResolvedValue([{ nest }] as any)
      presenter.toReferenceView.mockReturnValue({ slug: 'reference' } as any)

      const result = await service.listMembershipReferencesByUser('user-1')

      expect(presenter.toReferenceView).toHaveBeenCalledWith(nest)
      expect(result).toEqual([{ slug: 'reference' }])
    })
  })
})
