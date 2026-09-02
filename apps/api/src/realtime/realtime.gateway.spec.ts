import { createChatPolicySubject } from 'test/factories/chat-policy-subject.factory'
import { ChatNotFoundException } from 'src/chat/exceptions/chat-not-found.exception'
import { RealtimeGateway, chatRoom } from './realtime.gateway'

describe('RealtimeGateway', () => {
  const chatRepo = { getById: jest.fn() }
  const chatPolicy = { assertCanViewChat: jest.fn() }

  const gateway = new RealtimeGateway(undefined as any, undefined as any, chatRepo as any, chatPolicy as any)

  const join = jest.fn()
  const leave = jest.fn()
  const emit = jest.fn()
  const to = jest.fn(() => ({ emit }))
  const rooms = new Set<string>()
  const client: any = { data: { userId: 'user-1' }, join, leave, to, rooms }

  beforeEach(() => {
    jest.clearAllMocks()
    rooms.clear()
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

  describe('typing indicators', () => {
    it('broadcasts chat:typing:start to the room, excluding the sender, when the socket has joined it', () => {
      rooms.add(chatRoom('chat-1'))

      gateway.onTypingStart(client, { chatId: 'chat-1' })

      expect(to).toHaveBeenCalledWith(chatRoom('chat-1'))
      expect(emit).toHaveBeenCalledWith('chat:typing:start', { chatId: 'chat-1', userId: 'user-1' })
    })

    it('broadcasts chat:typing:stop to the room when the socket has joined it', () => {
      rooms.add(chatRoom('chat-1'))

      gateway.onTypingStop(client, { chatId: 'chat-1' })

      expect(to).toHaveBeenCalledWith(chatRoom('chat-1'))
      expect(emit).toHaveBeenCalledWith('chat:typing:stop', { chatId: 'chat-1', userId: 'user-1' })
    })

    it('does not broadcast typing events for a room the socket never joined', () => {
      gateway.onTypingStart(client, { chatId: 'chat-1' })
      gateway.onTypingStop(client, { chatId: 'chat-1' })

      expect(to).not.toHaveBeenCalled()
    })

    it('does not broadcast without a chatId', () => {
      rooms.add(chatRoom('chat-1'))

      gateway.onTypingStart(client, {})

      expect(to).not.toHaveBeenCalled()
    })
  })

  describe('emitToRoom', () => {
    it('emits to the given room when the server is attached', () => {
      gateway.server = { to } as any

      gateway.emitToRoom(chatRoom('chat-1'), 'chat:read', { chatId: 'chat-1' })

      expect(to).toHaveBeenCalledWith(chatRoom('chat-1'))
      expect(emit).toHaveBeenCalledWith('chat:read', { chatId: 'chat-1' })
    })

    it('does nothing when the server has not been attached yet (e.g. running outside the HTTP process)', () => {
      gateway.server = undefined as any

      expect(() => gateway.emitToRoom(chatRoom('chat-1'), 'chat:read', { chatId: 'chat-1' })).not.toThrow()
      expect(to).not.toHaveBeenCalled()
    })
  })
})
