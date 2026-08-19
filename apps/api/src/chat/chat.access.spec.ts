import { createChatPolicySubject } from 'test/factories/chat-policy-subject.factory'
import { createMockBlockService } from 'test/factories/block-service.mock-factory'
import { ChatAccess } from './chat.access'

describe('ChatAccess', () => {
  const blocks = createMockBlockService()
  const chatAccess = new ChatAccess(blocks as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('denies access to a non-participant', async () => {
    const chat = createChatPolicySubject()

    const ctx = await chatAccess.getContext(chat, 'user-3')

    expect(ctx.isParticipant).toBe(false)
    expect(ctx.canViewChat).toBe(false)
    expect(ctx.canSendMessage).toBe(false)
    expect(blocks.exists).not.toHaveBeenCalled()
  })

  it('allows sending when neither participant has blocked the other', async () => {
    const chat = createChatPolicySubject()
    blocks.exists.mockResolvedValue(false)

    const ctx = await chatAccess.getContext(chat, 'user-1')

    expect(ctx.isParticipant).toBe(true)
    expect(ctx.canViewChat).toBe(true)
    expect(ctx.canSendMessage).toBe(true)
    expect(ctx.youBlockedThem).toBe(false)
    expect(ctx.blockedByThem).toBe(false)
  })

  it('blocks sending, but still allows viewing, when the viewer blocked the other participant', async () => {
    const chat = createChatPolicySubject()
    blocks.exists.mockImplementation((blockerId: string) => Promise.resolve(blockerId === 'user-1'))

    const ctx = await chatAccess.getContext(chat, 'user-1')

    expect(ctx.canViewChat).toBe(true)
    expect(ctx.canSendMessage).toBe(false)
    expect(ctx.youBlockedThem).toBe(true)
    expect(ctx.blockedByThem).toBe(false)
  })

  it('blocks sending, but still allows viewing, when the viewer was blocked by the other participant', async () => {
    const chat = createChatPolicySubject()
    blocks.exists.mockImplementation((blockerId: string) => Promise.resolve(blockerId === 'user-2'))

    const ctx = await chatAccess.getContext(chat, 'user-1')

    expect(ctx.canViewChat).toBe(true)
    expect(ctx.canSendMessage).toBe(false)
    expect(ctx.youBlockedThem).toBe(false)
    expect(ctx.blockedByThem).toBe(true)
  })

  it('skips block checks and always allows sending in a group chat', async () => {
    const chat = createChatPolicySubject({ isGroup: true })

    const ctx = await chatAccess.getContext(chat, 'user-1')

    expect(ctx.canSendMessage).toBe(true)
    expect(blocks.exists).not.toHaveBeenCalled()
  })
})
