import { createChatAccessContext } from 'test/factories/chat-access-context.factory'
import { createMockChatAccess } from 'test/factories/chat-access.mock-factory'
import { createChatPolicySubject } from 'test/factories/chat-policy-subject.factory'
import { CannotMessageBlockedUserException } from './exceptions/cannot-message-blocked-user.exception'
import { ChatNotFoundException } from './exceptions/chat-not-found.exception'
import { ChatPolicy } from './chat.policy'

describe('ChatPolicy', () => {
  const chatAccess = createMockChatAccess()
  const policy = new ChatPolicy(chatAccess as any)

  const chat = createChatPolicySubject()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanViewChat', () => {
    it('resolves with the context when canViewChat is true', async () => {
      const ctx = createChatAccessContext({ canViewChat: true })
      chatAccess.getContext.mockResolvedValue(ctx)

      await expect(policy.assertCanViewChat(chat, 'user-1')).resolves.toEqual(ctx)
    })

    it('throws ChatNotFoundException when canViewChat is false', async () => {
      chatAccess.getContext.mockResolvedValue(createChatAccessContext({ canViewChat: false }))

      await expect(policy.assertCanViewChat(chat, 'user-3')).rejects.toThrow(ChatNotFoundException)
    })
  })

  describe('assertCanSendMessage', () => {
    it('allows when canViewChat and canSendMessage are true', async () => {
      chatAccess.getContext.mockResolvedValue(createChatAccessContext({ canViewChat: true, canSendMessage: true }))

      await expect(policy.assertCanSendMessage(chat, 'user-1')).resolves.toBeDefined()
    })

    it('throws ChatNotFoundException when canViewChat is false', async () => {
      chatAccess.getContext.mockResolvedValue(createChatAccessContext({ canViewChat: false }))

      await expect(policy.assertCanSendMessage(chat, 'user-3')).rejects.toThrow(ChatNotFoundException)
    })

    it('throws CannotMessageBlockedUserException when canSendMessage is false', async () => {
      chatAccess.getContext.mockResolvedValue(createChatAccessContext({ canViewChat: true, canSendMessage: false, youBlockedThem: true }))

      await expect(policy.assertCanSendMessage(chat, 'user-1')).rejects.toThrow(CannotMessageBlockedUserException)
    })
  })
})
