import { NestInviteStatus } from 'generated/prisma/enums'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockNestInvitePolicy } from 'test/factories/nest-invite-policy.mock-factory'
import { createMockNestInvitePresenter } from 'test/factories/nest-invite-presenter.mock-factory'
import { createMockNestInviteRepository } from 'test/factories/nest-invite-repository.mock-factory'
import { createNestInviteSummary } from 'test/factories/nest-invite-summary.factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { InviteAcceptedEvent } from './events/invite-accepted.event'
import { InviteDeclinedEvent } from './events/invite-declined.event'
import { InviteRevokedEvent } from './events/invite-revoked.event'
import { InviteSentEvent } from './events/invite-sent.event'
import { NestInviteNotFoundException } from './exceptions/nest-invite-not-found.exception'
import { NestInviteService } from './nest-invite.service'

describe('NestInviteService', () => {
  const nestRepo = createMockNestRepository()
  const inviteRepo = createMockNestInviteRepository()
  const memberRepo = createMockNestMemberRepository()
  const policy = createMockNestInvitePolicy()
  const presenter = createMockNestInvitePresenter()
  const transaction = createMockTransactionManager()
  const eventBus = createMockEventBus()

  const service = new NestInviteService(
    nestRepo,
    inviteRepo as any,
    memberRepo,
    policy as any,
    presenter as any,
    transaction as any,
    eventBus,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates the invite and publishes InviteSentEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1', slug: 'nest-slug', name: 'Nest' })
      const invite = createNestInviteSummary({ id: 'invite-1', message: 'welcome' })
      const view = { id: 'view-1' }

      nestRepo.getBySlug.mockResolvedValue(nest)
      inviteRepo.create.mockResolvedValue(invite)
      presenter.toNestView.mockReturnValue(view as any)

      const result = await service.create('nest-slug', 'actor-1', 'target-1')

      expect(policy.assertCanCreate).toHaveBeenCalledWith(nest, 'actor-1', 'target-1')
      expect(inviteRepo.create).toHaveBeenCalledWith('nest-1', 'target-1', 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(InviteSentEvent))
      expect(result).toBe(view)
    })

    it('propagates the policy failure and never creates an invite', async () => {
      const nest = createNestSummary()
      policy.assertCanCreate.mockRejectedValue(new Error('cannot invite'))
      nestRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.create('nest-slug', 'actor-1', 'target-1')).rejects.toThrow('cannot invite')

      expect(inviteRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('accept', () => {
    it('marks the invite accepted, adds the member, bumps the count, and publishes InviteAcceptedEvent', async () => {
      const invite = createNestInviteSummary({ id: 'invite-1' })
      inviteRepo.getSummary.mockResolvedValue(invite)

      await service.accept('invite-1', 'user-1')

      expect(policy.assertCanAccept).toHaveBeenCalledWith(
        { userId: invite.user.id, nestId: invite.nest.id, status: invite.status },
        'user-1',
      )
      expect(inviteRepo.accept).toHaveBeenCalledWith('invite-1', 'user-1', {})
      expect(memberRepo.createMember).toHaveBeenCalledWith(invite.nest.id, invite.user.id, {})
      expect(nestRepo.adjustMemberCount).toHaveBeenCalledWith(invite.nest.id, 1, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(InviteAcceptedEvent))
    })

    it('propagates the policy failure and never mutates anything', async () => {
      const invite = createNestInviteSummary({ status: NestInviteStatus.REVOKED })
      inviteRepo.getSummary.mockResolvedValue(invite)
      policy.assertCanAccept.mockRejectedValue(new Error('cannot accept'))

      await expect(service.accept('invite-1', 'user-1')).rejects.toThrow('cannot accept')

      expect(inviteRepo.accept).not.toHaveBeenCalled()
      expect(memberRepo.createMember).not.toHaveBeenCalled()
      expect(eventBus.publish).not.toHaveBeenCalled()
    })
  })

  describe('decline', () => {
    it('declines the invite and publishes InviteDeclinedEvent', async () => {
      const invite = createNestInviteSummary({ id: 'invite-1' })
      inviteRepo.getSummary.mockResolvedValue(invite)

      await service.decline('invite-1', 'user-1')

      expect(inviteRepo.decline).toHaveBeenCalledWith('invite-1', 'user-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(InviteDeclinedEvent))
    })

    it('propagates the policy failure and never declines', async () => {
      const invite = createNestInviteSummary()
      inviteRepo.getSummary.mockResolvedValue(invite)
      policy.assertCanDecline.mockRejectedValue(new Error('cannot decline'))

      await expect(service.decline('invite-1', 'user-1')).rejects.toThrow('cannot decline')

      expect(inviteRepo.decline).not.toHaveBeenCalled()
    })
  })

  describe('revoke', () => {
    it('revokes the invite once it belongs to the given nest and publishes InviteRevokedEvent', async () => {
      const invite = createNestInviteSummary({ id: 'invite-1', nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest', iconKey: null } })
      inviteRepo.getSummary.mockResolvedValue(invite)

      await service.revoke('nest-slug', 'invite-1', 'actor-1')

      expect(inviteRepo.revoke).toHaveBeenCalledWith('invite-1', 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(InviteRevokedEvent))
    })

    it('throws NestInviteNotFoundException when the invite belongs to a different nest', async () => {
      const invite = createNestInviteSummary({ nest: { id: 'nest-1', slug: 'other-nest', name: 'Other', iconKey: null } })
      inviteRepo.getSummary.mockResolvedValue(invite)

      await expect(service.revoke('nest-slug', 'invite-1', 'actor-1')).rejects.toThrow(NestInviteNotFoundException)

      expect(inviteRepo.revoke).not.toHaveBeenCalled()
    })

    it('propagates the policy failure and never revokes', async () => {
      const invite = createNestInviteSummary({ nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest', iconKey: null } })
      inviteRepo.getSummary.mockResolvedValue(invite)
      policy.assertCanRevoke.mockRejectedValue(new Error('cannot revoke'))

      await expect(service.revoke('nest-slug', 'invite-1', 'actor-1')).rejects.toThrow('cannot revoke')

      expect(inviteRepo.revoke).not.toHaveBeenCalled()
    })
  })

  describe('listAsUser', () => {
    it('presents every invite addressed to the actor', async () => {
      const invites = [createNestInviteSummary({ id: 'invite-1' }), createNestInviteSummary({ id: 'invite-2' })]
      const view = { id: 'view' }

      inviteRepo.listAsUser.mockResolvedValue(invites as any)
      presenter.toUserView.mockReturnValue(view as any)

      const result = await service.listAsUser('user-1')

      expect(inviteRepo.listAsUser).toHaveBeenCalledWith('user-1')
      expect(result).toEqual([view, view])
    })
  })
})
