import { createChatPolicySubject } from 'test/factories/chat-policy-subject.factory'
import { createMockChatPolicy } from 'test/factories/chat-policy.mock-factory'
import { createMockChatRepository } from 'test/factories/chat-repository.mock-factory'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMessageSummary } from 'test/factories/message-summary.factory'
import { createMockMessagePresenter } from 'test/factories/message-presenter.mock-factory'
import { createMockMessageRepository } from 'test/factories/message-repository.mock-factory'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { ChatReadEvent } from '../events/chat-read.event'
import { MessageNotFoundException } from '../exceptions/message-not-found.exception'
import { ReplyTargetNotInChatException } from '../exceptions/reply-target-not-in-chat.exception'
import { MessageCreatedEvent } from './events/message-created.event'
import { MessageService } from './message.service'

describe('MessageService', () => {
  const messagesRepo = createMockMessageRepository()
  const chatsRepo = createMockChatRepository()
  const chatPolicy = createMockChatPolicy()
  const presenter = createMockMessagePresenter()
  const eventBus = createMockEventBus()

  const service = new MessageService(
    messagesRepo as any,
    chatsRepo as any,
    chatPolicy as any,
    presenter as any,
    eventBus,
  )

  beforeEach(() => {
    jest.clearAllMocks()
    presenter.toView.mockReturnValue({ id: 'view' } as any)
  })

  describe('listMessages', () => {
    it('marks the chat read and publishes ChatReadEvent when it had unread messages', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1', participants: [{ userId: 'user-1', archivedAt: null, clearedAt: null }] })
      chatsRepo.getById.mockResolvedValue(subject)
      chatsRepo.markRead.mockResolvedValue(true)
      messagesRepo.list.mockResolvedValue({ items: [], meta: { nextCursor: null, hasMore: false } })

      await service.listMessages('user-1', 'chat-1', {} as any)

      expect(chatPolicy.assertCanViewChat).toHaveBeenCalledWith(subject, 'user-1')
      expect(chatsRepo.markRead).toHaveBeenCalledWith('chat-1', 'user-1', expect.any(Date))
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ChatReadEvent))
    })

    it('does not publish ChatReadEvent when the chat had no unread messages', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      chatsRepo.markRead.mockResolvedValue(false)
      messagesRepo.list.mockResolvedValue({ items: [], meta: { nextCursor: null, hasMore: false } })

      await service.listMessages('user-1', 'chat-1', {} as any)

      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('lists messages visible after the viewer\'s own clearedAt', async () => {
      const clearedAt = new Date('2024-01-01T00:00:00.000Z')
      const subject = createChatPolicySubject({
        id: 'chat-1',
        participants: [{ userId: 'user-1', archivedAt: null, clearedAt }],
      })
      chatsRepo.getById.mockResolvedValue(subject)
      chatsRepo.markRead.mockResolvedValue(false)
      messagesRepo.list.mockResolvedValue({ items: [], meta: { nextCursor: null, hasMore: false } })

      await service.listMessages('user-1', 'chat-1', {} as any)

      expect(messagesRepo.list).toHaveBeenCalledWith('chat-1', clearedAt, {})
    })

    it('passes a null clearedAt when the viewer is not a listed participant', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1', participants: [{ userId: 'someone-else', archivedAt: null, clearedAt: null }] })
      chatsRepo.getById.mockResolvedValue(subject)
      chatsRepo.markRead.mockResolvedValue(false)
      messagesRepo.list.mockResolvedValue({ items: [], meta: { nextCursor: null, hasMore: false } })

      await service.listMessages('user-1', 'chat-1', {} as any)

      expect(messagesRepo.list).toHaveBeenCalledWith('chat-1', null, {})
    })

    it('presents every message in the page', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      chatsRepo.markRead.mockResolvedValue(false)
      const page = { items: [createMessageSummary({ id: 'm1' }), createMessageSummary({ id: 'm2' })], meta: { nextCursor: null, hasMore: false } }
      messagesRepo.list.mockResolvedValue(page)

      const result = await service.listMessages('user-1', 'chat-1', {} as any)

      expect(presenter.toView).toHaveBeenCalledTimes(2)
      expect(result.items).toEqual([{ id: 'view' }, { id: 'view' }])
    })
  })

  describe('sendMessage', () => {
    const dto = { content: 'hello' }

    it('creates the message, touches lastMessageAt, marks read, and publishes MessageCreatedEvent', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      const created = createMessageSummary({ id: 'message-1', createdAt: new Date('2024-02-01T00:00:00.000Z') })
      chatsRepo.getById.mockResolvedValue(subject)
      messagesRepo.create.mockResolvedValue(created)
      chatsRepo.markRead.mockResolvedValue(false)

      await service.sendMessage('user-1', 'chat-1', dto)

      expect(chatPolicy.assertCanSendMessage).toHaveBeenCalledWith(subject, 'user-1')
      expect(messagesRepo.create).toHaveBeenCalledWith('chat-1', 'user-1', dto)
      expect(chatsRepo.touchLastMessageAt).toHaveBeenCalledWith('chat-1', created.createdAt)
      expect(chatsRepo.markRead).toHaveBeenCalledWith('chat-1', 'user-1', created.createdAt)
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(MessageCreatedEvent))
    })

    it('also publishes ChatReadEvent when sending clears an unread state for the sender', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      messagesRepo.create.mockResolvedValue(createMessageSummary())
      chatsRepo.markRead.mockResolvedValue(true)

      await service.sendMessage('user-1', 'chat-1', dto)

      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(MessageCreatedEvent))
      expect(eventBus.publish).toHaveBeenCalledWith(expect.any(ChatReadEvent))
    })

    it('rejects replying to a message from a different chat', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      messagesRepo.getById.mockResolvedValue(createMessageSummary({ id: 'reply-1', chatId: 'other-chat' }))

      await expect(service.sendMessage('user-1', 'chat-1', { ...dto, replyToId: 'reply-1' } as any)).rejects.toThrow(ReplyTargetNotInChatException)

      expect(messagesRepo.create).not.toHaveBeenCalled()
    })

    it('allows replying to a message from the same chat', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      messagesRepo.getById.mockResolvedValue(createMessageSummary({ id: 'reply-1', chatId: 'chat-1' }))
      messagesRepo.create.mockResolvedValue(createMessageSummary())
      chatsRepo.markRead.mockResolvedValue(false)

      await service.sendMessage('user-1', 'chat-1', { ...dto, replyToId: 'reply-1' })

      expect(messagesRepo.create).toHaveBeenCalledWith('chat-1', 'user-1', { ...dto, replyToId: 'reply-1' })
    })

    it('propagates the policy failure without creating a message', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      chatPolicy.assertCanSendMessage.mockRejectedValueOnce(new Error('blocked'))

      await expect(service.sendMessage('user-1', 'chat-1', dto as any)).rejects.toThrow('blocked')

      expect(messagesRepo.create).not.toHaveBeenCalled()
    })
  })

  describe('deleteMessage', () => {
    it('soft-deletes the message when the actor is its sender', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      messagesRepo.getById.mockResolvedValue(createMessageSummary({ id: 'message-1', chatId: 'chat-1', senderId: 'user-1' }))

      await service.deleteMessage('user-1', 'chat-1', 'message-1')

      expect(messagesRepo.softDelete).toHaveBeenCalledWith('message-1', 'user-1')
    })

    it('throws MessageNotFoundException when the message belongs to a different chat', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      messagesRepo.getById.mockResolvedValue(createMessageSummary({ id: 'message-1', chatId: 'other-chat' }))

      await expect(service.deleteMessage('user-1', 'chat-1', 'message-1')).rejects.toThrow(MessageNotFoundException)

      expect(messagesRepo.softDelete).not.toHaveBeenCalled()
    })

    it('throws InsufficientPermissionsException when the actor did not send the message', async () => {
      const subject = createChatPolicySubject({ id: 'chat-1' })
      chatsRepo.getById.mockResolvedValue(subject)
      messagesRepo.getById.mockResolvedValue(createMessageSummary({ id: 'message-1', chatId: 'chat-1', senderId: 'someone-else' }))

      await expect(service.deleteMessage('user-1', 'chat-1', 'message-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(messagesRepo.softDelete).not.toHaveBeenCalled()
    })
  })
})
