import { createChatPolicySubject } from 'test/factories/chat-policy-subject.factory'
import { ChatNotFoundException } from 'src/chat/exceptions/chat-not-found.exception'
import { RealtimeGateway, chatRoom } from './realtime.gateway'

describe('RealtimeGateway', () => {
  const chatRepo = { getById: jest.fn() }
  const chatPolicy = { assertCanViewChat: jest.fn() }

  const gateway = new RealtimeGateway(undefined as any, undefined as any, chatRepo as any, chatPolicy as any)

  const join = jest.fn()
  const leave = jest.fn()
  const client: any = { data: { userId: 'user-1' }, join, leave }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('onChatJoin', () => {
    it('joins the chat room when the socket\'s user can view the chat', async () => {
      const chat = createChatPolicySubject()
      chatRepo.getById.mockResolvedValue(chat)
      chatPolicy.assertCanViewChat.mockResolvedValue(undefined)

      const result = await gateway.onChatJoin(client, { chatId: 'chat-1' })

      expect(chatRepo.getById).toHaveBeenCalledWith('chat-1')
      expect(chatPolicy.assertCanViewChat).toHaveBeenCalledWith(chat, 'user-1')
      expect(join).toHaveBeenCalledWith(chatRoom('chat-1'))
      expect(result).toEqual({ ok: true })
    })

    it('refuses to join when the chat can\'t be viewed', async () => {
      chatRepo.getById.mockResolvedValue(createChatPolicySubject())
      chatPolicy.assertCanViewChat.mockRejectedValue(new ChatNotFoundException())

      const result = await gateway.onChatJoin(client, { chatId: 'chat-1' })

      expect(join).not.toHaveBeenCalled()
      expect(result).toEqual({ ok: false, error: 'not found' })
    })

    it('refuses to join without a chatId', async () => {
      const result = await gateway.onChatJoin(client, {})

      expect(chatRepo.getById).not.toHaveBeenCalled()
      expect(result).toEqual({ ok: false, error: 'chatId is required' })
    })
  })

  describe('onChatLeave', () => {
    it('leaves the chat room', async () => {
      const result = await gateway.onChatLeave(client, { chatId: 'chat-1' })

      expect(leave).toHaveBeenCalledWith(chatRoom('chat-1'))
      expect(result).toEqual({ ok: true })
    })
  })
})
