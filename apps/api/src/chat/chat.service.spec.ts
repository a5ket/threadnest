import { createChatAccessContext } from 'test/factories/chat-access-context.factory'
import { createMockChatAccess } from 'test/factories/chat-access.mock-factory'
import { createMockChatPolicy } from 'test/factories/chat-policy.mock-factory'
import { createChatPolicySubject } from 'test/factories/chat-policy-subject.factory'
import { createMockChatPresenter } from 'test/factories/chat-presenter.mock-factory'
import { createMockChatRepository } from 'test/factories/chat-repository.mock-factory'
import { createChatSummary } from 'test/factories/chat-summary.factory'
import { createMockBlockService } from 'test/factories/block-service.mock-factory'
import { createMockUserService } from 'test/factories/user-service.mock-factory'
import { CannotChatWithYourselfException } from './exceptions/cannot-chat-with-yourself.exception'
import { CannotMessageBlockedUserException } from './exceptions/cannot-message-blocked-user.exception'
import { ChatService } from './chat.service'

describe('ChatService', () => {
  const chatsRepo = createMockChatRepository()
  const users = createMockUserService()
  const blocks = createMockBlockService()
  const chatAccess = createMockChatAccess()
  const chatPolicy = createMockChatPolicy()
  const presenter = createMockChatPresenter()

  const service = new ChatService(
    chatsRepo as any,
    users as any,
    blocks as any,
    chatAccess as any,
    chatPolicy as any,
    presenter as any,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    blocks.exists.mockResolvedValue(false)
  })

  describe('startDirectChat', () => {
    it('rejects starting a chat with yourself before checking anything else', async () => {
      await expect(service.startDirectChat('user-1', 'user-1')).rejects.toThrow(CannotChatWithYourselfException)

      expect(users.assertUserExists).not.toHaveBeenCalled()
    })

    it('returns the existing chat without touching blocks or creating a new one', async () => {
      const existing = createChatSummary({ id: 'chat-1' })
      chatsRepo.findDirect.mockResolvedValue(existing)
      chatAccess.getContext.mockResolvedValue(createChatAccessContext())
      presenter.toDetailView.mockReturnValue({ id: 'view' } as any)

      await service.startDirectChat('user-1', 'user-2')

      expect(blocks.exists).not.toHaveBeenCalled()
      expect(chatsRepo.createDirect).not.toHaveBeenCalled()
    })

    it('rejects when the actor has blocked the target', async () => {
      chatsRepo.findDirect.mockResolvedValue(null)
      blocks.exists.mockImplementation((a: string, b: string) => Promise.resolve(a === 'user-1' && b === 'user-2'))

      await expect(service.startDirectChat('user-1', 'user-2')).rejects.toThrow(CannotMessageBlockedUserException)

      expect(chatsRepo.createDirect).not.toHaveBeenCalled()
    })

    it('rejects when the actor is blocked by the target', async () => {
      chatsRepo.findDirect.mockResolvedValue(null)
      blocks.exists.mockImplementation((a: string, b: string) => Promise.resolve(a === 'user-2' && b === 'user-1'))

      await expect(service.startDirectChat('user-1', 'user-2')).rejects.toThrow(CannotMessageBlockedUserException)

      expect(chatsRepo.createDirect).not.toHaveBeenCalled()
    })

    it('creates a new direct chat when neither side has blocked the other', async () => {
      const chat = createChatSummary({ id: 'chat-1' })
      chatsRepo.findDirect.mockResolvedValue(null)
      chatsRepo.createDirect.mockResolvedValue(chat)
      chatAccess.getContext.mockResolvedValue(createChatAccessContext())
      presenter.toDetailView.mockReturnValue({ id: 'view' } as any)

      await service.startDirectChat('user-1', 'user-2')

      expect(chatsRepo.createDirect).toHaveBeenCalledWith('user-1', 'user-2')
    })
  })

  describe('getChat', () => {
    it('checks the policy against the policy-subject shape, then presents the full summary', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      const summary = createChatSummary({ id: 'chat-1' })
      const ctx = createChatAccessContext()

      chatsRepo.getById.mockResolvedValue(subject)
      chatPolicy.assertCanViewChat.mockResolvedValue(ctx)
      chatsRepo.getSummaryById.mockResolvedValue(summary)
      presenter.toDetailView.mockReturnValue({ id: 'view' } as any)

      const result = await service.getChat('user-1', 'chat-1')

      expect(chatPolicy.assertCanViewChat).toHaveBeenCalledWith(subject, 'user-1')
      expect(presenter.toDetailView).toHaveBeenCalledWith(summary, 'user-1', ctx)
      expect(result).toEqual({ id: 'view' })
    })
  })

  describe('listChats', () => {
    it('presents every chat in the page for the viewer', async () => {
      const page = { items: [createChatSummary({ id: 'chat-1' }), createChatSummary({ id: 'chat-2' })], meta: { nextCursor: null, hasMore: false } }
      chatsRepo.list.mockResolvedValue(page)
      presenter.toSummaryView.mockReturnValue({ id: 'view' } as any)

      const result = await service.listChats('user-1', {} as any)

      expect(presenter.toSummaryView).toHaveBeenCalledTimes(2)
      expect(result.items).toEqual([{ id: 'view' }, { id: 'view' }])
      expect(result.meta).toBe(page.meta)
    })
  })

  describe('getUnreadCount', () => {
    const candidate = (overrides: Record<string, unknown> = {}) => ({
      lastReadAt: null,
      clearedAt: null,
      chat: { lastMessageAt: new Date('2024-06-01T00:00:00.000Z') },
      ...overrides,
    })

    it('excludes chats with no last message at all', async () => {
      chatsRepo.listUnreadCandidates.mockResolvedValue([candidate({ chat: { lastMessageAt: null } })])

      await expect(service.getUnreadCount('user-1')).resolves.toBe(0)
    })

    it('excludes chats cleared at or after the last message', async () => {
      chatsRepo.listUnreadCandidates.mockResolvedValue([candidate({
        clearedAt: new Date('2024-06-01T00:00:00.000Z'),
      })])

      await expect(service.getUnreadCount('user-1')).resolves.toBe(0)
    })

    it('counts a chat that was cleared strictly before the last message', async () => {
      chatsRepo.listUnreadCandidates.mockResolvedValue([candidate({
        clearedAt: new Date('2024-05-01T00:00:00.000Z'),
      })])

      await expect(service.getUnreadCount('user-1')).resolves.toBe(1)
    })

    it('counts a chat that has never been read', async () => {
      chatsRepo.listUnreadCandidates.mockResolvedValue([candidate({ lastReadAt: null })])

      await expect(service.getUnreadCount('user-1')).resolves.toBe(1)
    })

    it('counts a chat whose last message arrived after the last read time', async () => {
      chatsRepo.listUnreadCandidates.mockResolvedValue([candidate({
        lastReadAt: new Date('2024-05-01T00:00:00.000Z'),
      })])

      await expect(service.getUnreadCount('user-1')).resolves.toBe(1)
    })

    it('excludes a chat whose last message arrived at or before the last read time', async () => {
      chatsRepo.listUnreadCandidates.mockResolvedValue([candidate({
        lastReadAt: new Date('2024-06-01T00:00:00.000Z'),
      })])

      await expect(service.getUnreadCount('user-1')).resolves.toBe(0)
    })

    it('sums unread chats across multiple candidates', async () => {
      chatsRepo.listUnreadCandidates.mockResolvedValue([
        candidate({ lastReadAt: null }),
        candidate({ lastReadAt: new Date('2024-06-01T00:00:00.000Z') }),
        candidate({ lastReadAt: new Date('2024-05-01T00:00:00.000Z') }),
      ])

      await expect(service.getUnreadCount('user-1')).resolves.toBe(2)
    })
  })

  describe('archiveChat', () => {
    it('checks the policy, then archives with the current time', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)

      await service.archiveChat('user-1', 'chat-1')

      expect(chatPolicy.assertCanViewChat).toHaveBeenCalledWith(subject, 'user-1')
      expect(chatsRepo.setArchived).toHaveBeenCalledWith('chat-1', 'user-1', expect.any(Date))
    })

    it('propagates the policy failure without archiving', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      chatPolicy.assertCanViewChat.mockRejectedValueOnce(new Error('cannot view'))

      await expect(service.archiveChat('user-1', 'chat-1')).rejects.toThrow('cannot view')

      expect(chatsRepo.setArchived).not.toHaveBeenCalled()
    })
  })

  describe('unarchiveChat', () => {
    it('checks the policy, then clears the archived timestamp', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)

      await service.unarchiveChat('user-1', 'chat-1')

      expect(chatsRepo.setArchived).toHaveBeenCalledWith('chat-1', 'user-1', null)
    })
  })

  describe('clearChat', () => {
    it('checks the policy, then clears the chat', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)

      await service.clearChat('user-1', 'chat-1')

      expect(chatPolicy.assertCanViewChat).toHaveBeenCalledWith(subject, 'user-1')
      expect(chatsRepo.clear).toHaveBeenCalledWith('chat-1', 'user-1')
    })
  })
})
