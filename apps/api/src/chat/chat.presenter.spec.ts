import { UserPresenter } from 'src/user/user.presenter'
import { createChatAccessContext } from 'test/factories/chat-access-context.factory'
import { createChatSummary } from 'test/factories/chat-summary.factory'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { ChatPresenter } from './chat.presenter'

describe('ChatPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new ChatPresenter(new UserPresenter(storage as any))

  const message = (overrides: Record<string, unknown> = {}) => ({
    id: 'message-1',
    content: 'hello',
    senderId: 'user-2',
    createdAt: new Date('2024-06-01T12:00:00.000Z'),
    deletedAt: null,
    ...overrides,
  })

  describe('toSummaryView', () => {
    it('resolves the other participant as a user reference', () => {
      const chat = createChatSummary()

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.otherParticipant).toMatchObject({ id: 'user-2' })
    })

    it('returns a null other participant for a group chat entry with no counterpart found', () => {
      const chat = createChatSummary({
        participants: [{ userId: 'user-1', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-1', profile: null } }],
      })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.otherParticipant).toBeNull()
    })

    it('returns a null last message when there is none', () => {
      const chat = createChatSummary({ messages: [] })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.lastMessage).toBeNull()
      expect(view.hasUnread).toBe(false)
    })

    it('hides the last message when it predates the viewer clearing the chat', () => {
      const chat = createChatSummary({
        participants: [
          { userId: 'user-1', lastReadAt: null, archivedAt: null, clearedAt: new Date('2024-06-01T13:00:00.000Z'), user: { id: 'user-1', profile: null } },
          { userId: 'user-2', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-2', profile: null } },
        ],
        messages: [message({ createdAt: new Date('2024-06-01T12:00:00.000Z') })],
      })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.lastMessage).toBeNull()
    })

    it('shows the last message when it postdates the viewer clearing the chat', () => {
      const chat = createChatSummary({
        participants: [
          { userId: 'user-1', lastReadAt: null, archivedAt: null, clearedAt: new Date('2024-06-01T10:00:00.000Z'), user: { id: 'user-1', profile: null } },
          { userId: 'user-2', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-2', profile: null } },
        ],
        messages: [message({ createdAt: new Date('2024-06-01T12:00:00.000Z') })],
      })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.lastMessage).not.toBeNull()
    })

    it('masks the content of a deleted last message but still shows its metadata', () => {
      const chat = createChatSummary({ messages: [message({ deletedAt: new Date() })] })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.lastMessage?.content).toBeNull()
      expect(view.lastMessage?.id).toBe('message-1')
    })

    it('reports unread when the viewer has never read the chat', () => {
      const chat = createChatSummary({ messages: [message()] })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.hasUnread).toBe(true)
    })

    it('reports unread when the last message arrived after the viewer last read', () => {
      const chat = createChatSummary({
        participants: [
          { userId: 'user-1', lastReadAt: new Date('2024-06-01T10:00:00.000Z'), archivedAt: null, clearedAt: null, user: { id: 'user-1', profile: null } },
          { userId: 'user-2', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-2', profile: null } },
        ],
        messages: [message({ createdAt: new Date('2024-06-01T12:00:00.000Z') })],
      })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.hasUnread).toBe(true)
    })

    it('reports read when the last message arrived at or before the viewer last read', () => {
      const chat = createChatSummary({
        participants: [
          { userId: 'user-1', lastReadAt: new Date('2024-06-01T12:00:00.000Z'), archivedAt: null, clearedAt: null, user: { id: 'user-1', profile: null } },
          { userId: 'user-2', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-2', profile: null } },
        ],
        messages: [message({ createdAt: new Date('2024-06-01T12:00:00.000Z') })],
      })

      const view = presenter.toSummaryView(chat, 'user-1')

      expect(view.hasUnread).toBe(false)
    })

    it('reports the viewer\'s own archivedAt, defaulting to null', () => {
      const archived = createChatSummary({
        participants: [
          { userId: 'user-1', lastReadAt: null, archivedAt: new Date('2024-06-01T00:00:00.000Z'), clearedAt: null, user: { id: 'user-1', profile: null } },
        ],
      })
      const notArchived = createChatSummary({
        participants: [{ userId: 'user-1', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-1', profile: null } }],
      })

      expect(presenter.toSummaryView(archived, 'user-1').archivedAt).toEqual(new Date('2024-06-01T00:00:00.000Z'))
      expect(presenter.toSummaryView(notArchived, 'user-1').archivedAt).toBeNull()
    })
  })

  describe('toDetailView', () => {
    it('includes the access context and the other participant\'s last-read time', () => {
      const chat = createChatSummary({
        participants: [
          { userId: 'user-1', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-1', profile: null } },
          { userId: 'user-2', lastReadAt: new Date('2024-06-01T09:00:00.000Z'), archivedAt: null, clearedAt: null, user: { id: 'user-2', profile: null } },
        ],
      })
      const ctx = createChatAccessContext()

      const view = presenter.toDetailView(chat, 'user-1', ctx)

      expect(view.access).toBe(ctx)
      expect(view.otherParticipantLastReadAt).toEqual(new Date('2024-06-01T09:00:00.000Z'))
    })

    it('defaults the other participant\'s last-read time to null when there is no counterpart', () => {
      const chat = createChatSummary({
        participants: [{ userId: 'user-1', lastReadAt: null, archivedAt: null, clearedAt: null, user: { id: 'user-1', profile: null } }],
      })

      const view = presenter.toDetailView(chat, 'user-1', createChatAccessContext())

      expect(view.otherParticipantLastReadAt).toBeNull()
    })
  })
})
