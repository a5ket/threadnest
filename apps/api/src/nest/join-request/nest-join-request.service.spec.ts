import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createNestJoinRequestFlat, createNestJoinRequestSummary } from 'test/factories/nest-join-request-summary.factory'
import { createMockNestJoinRequestPolicy } from 'test/factories/nest-join-request-policy.mock-factory'
import { createMockNestJoinRequestPresenter } from 'test/factories/nest-join-request-presenter.mock-factory'
import { createMockNestJoinRequestRepository } from 'test/factories/nest-join-request-repository.mock-factory'
import { createMockNestRepository } from 'test/factories/nest-repository.mock-factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { createMockTransactionManager } from 'test/factories/transaction-manager.mock-factory'
import { NestJoinRequestApprovedEvent } from './events/nest-join-request-approved.event'
import { NestJoinRequestCancelledEvent } from './events/nest-join-request-cancelled.event'
import { NestJoinRequestCreatedEvent } from './events/nest-join-request-created.event'
import { NestJoinRequestRejectedEvent } from './events/nest-join-request-rejected.event'
import { NestJoinRequestNotFoundException } from './exceptions/nest-join-request-not-found.exception'
import { NestJoinRequestService } from './nest-join-request.service'

describe('NestJoinRequestService', () => {
  const nestRepo = createMockNestRepository()
  const requestRepo = createMockNestJoinRequestRepository()
  const memberRepo = createMockNestMemberRepository()
  const policy = createMockNestJoinRequestPolicy()
  const presenter = createMockNestJoinRequestPresenter()
  const transaction = createMockTransactionManager()
  const eventBus = createMockEventBus()

  const service = new NestJoinRequestService(
    nestRepo,
    requestRepo as any,
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
    it('creates the request and publishes NestJoinRequestCreatedEvent once the policy allows it', async () => {
      const nest = createNestSummary({ id: 'nest-1' })
      const request = createNestJoinRequestSummary({ id: 'request-1' })
      const view = { id: 'view-1' }

      nestRepo.getBySlug.mockResolvedValue(nest)
      requestRepo.create.mockResolvedValue(request)
      presenter.toUserView.mockReturnValue(view as any)

      const result = await service.create('nest-slug', 'user-1')

      expect(policy.assertCanCreate).toHaveBeenCalledWith(nest, 'user-1')
      expect(requestRepo.create).toHaveBeenCalledWith('nest-1', 'user-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestJoinRequestCreatedEvent))
      expect(result).toBe(view)
    })

    it('propagates the policy failure and never creates a request', async () => {
      const nest = createNestSummary()
      policy.assertCanCreate.mockRejectedValue(new Error('cannot request'))
      nestRepo.getBySlug.mockResolvedValue(nest)

      await expect(service.create('nest-slug', 'user-1')).rejects.toThrow('cannot request')

      expect(requestRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('cancel', () => {
    it('cancels the request (flat shape) and publishes NestJoinRequestCancelledEvent', async () => {
      const request = createNestJoinRequestFlat({ id: 'request-1', nestId: 'nest-1', userId: 'user-1' })
      requestRepo.get.mockResolvedValue(request)

      await service.cancel('request-1', 'user-1')

      expect(policy.assertCanCancel).toHaveBeenCalledWith(
        { nestId: 'nest-1', userId: 'user-1', status: request.status },
        'user-1',
      )
      expect(requestRepo.cancel).toHaveBeenCalledWith('request-1', 'user-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestJoinRequestCancelledEvent))
    })

    it('propagates the policy failure and never cancels', async () => {
      const request = createNestJoinRequestFlat()
      requestRepo.get.mockResolvedValue(request)
      policy.assertCanCancel.mockRejectedValue(new Error('cannot cancel'))

      await expect(service.cancel('request-1', 'user-1')).rejects.toThrow('cannot cancel')

      expect(requestRepo.cancel).not.toHaveBeenCalled()
    })
  })

  describe('approve', () => {
    it('approves the request, adds the member, bumps the count, and publishes NestJoinRequestApprovedEvent', async () => {
      const request = createNestJoinRequestSummary({ id: 'request-1' })
      requestRepo.getSummary.mockResolvedValue(request)

      await service.approve('nest-slug', 'request-1', 'actor-1')

      expect(requestRepo.approve).toHaveBeenCalledWith('request-1', 'actor-1', {})
      expect(memberRepo.createMember).toHaveBeenCalledWith(request.nest.id, request.user.id, {})
      expect(nestRepo.adjustMemberCount).toHaveBeenCalledWith(request.nest.id, 1, {})
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestJoinRequestApprovedEvent))
    })

    it('throws NestJoinRequestNotFoundException when the request belongs to a different nest', async () => {
      const request = createNestJoinRequestSummary({ nest: { id: 'nest-1', slug: 'other-nest', name: 'Other', iconKey: null } })
      requestRepo.getSummary.mockResolvedValue(request)

      await expect(service.approve('nest-slug', 'request-1', 'actor-1')).rejects.toThrow(NestJoinRequestNotFoundException)

      expect(requestRepo.approve).not.toHaveBeenCalled()
    })

    it('propagates the policy failure and never approves', async () => {
      const request = createNestJoinRequestSummary({ nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest', iconKey: null } })
      requestRepo.getSummary.mockResolvedValue(request)
      policy.assertCanApprove.mockRejectedValue(new Error('cannot approve'))

      await expect(service.approve('nest-slug', 'request-1', 'actor-1')).rejects.toThrow('cannot approve')

      expect(requestRepo.approve).not.toHaveBeenCalled()
      expect(memberRepo.createMember).not.toHaveBeenCalled()
    })
  })

  describe('reject', () => {
    it('rejects the request and publishes NestJoinRequestRejectedEvent', async () => {
      const request = createNestJoinRequestSummary({ id: 'request-1', nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest', iconKey: null } })
      requestRepo.getSummary.mockResolvedValue(request)

      await service.reject('nest-slug', 'request-1', 'actor-1')

      expect(requestRepo.reject).toHaveBeenCalledWith('request-1', 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(NestJoinRequestRejectedEvent))
    })

    it('propagates the policy failure and never rejects', async () => {
      const request = createNestJoinRequestSummary({ nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest', iconKey: null } })
      requestRepo.getSummary.mockResolvedValue(request)
      policy.assertCanReject.mockRejectedValue(new Error('cannot reject'))

      await expect(service.reject('nest-slug', 'request-1', 'actor-1')).rejects.toThrow('cannot reject')

      expect(requestRepo.reject).not.toHaveBeenCalled()
    })
  })

  describe('listAsUser', () => {
    it('presents every request made by the actor', async () => {
      const requests = [createNestJoinRequestSummary({ id: 'request-1' }), createNestJoinRequestSummary({ id: 'request-2' })]
      const view = { id: 'view' }

      requestRepo.listAsUser.mockResolvedValue(requests as any)
      presenter.toUserView.mockReturnValue(view as any)

      const result = await service.listAsUser('user-1')

      expect(requestRepo.listAsUser).toHaveBeenCalledWith('user-1')
      expect(result).toEqual([view, view])
    })
  })
})
