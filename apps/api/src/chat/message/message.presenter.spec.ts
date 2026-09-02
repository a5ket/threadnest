import { UserPresenter } from 'src/user/user.presenter'
import { createMessageSummary } from 'test/factories/message-summary.factory'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { MessagePresenter } from './message.presenter'

describe('MessagePresenter', () => {
  const storage = createMockStorageService()
  const presenter = new MessagePresenter(new UserPresenter(storage as any))

  describe('toView', () => {
    it('shows content when not deleted', () => {
      const message = createMessageSummary({ content: 'hello there' })

      const view = presenter.toView(message)

      expect(view.content).toBe('hello there')
    })

    it('masks content when the message was deleted', () => {
      const message = createMessageSummary({ content: 'hello there', deletedAt: new Date() })

      const view = presenter.toView(message)

      expect(view.content).toBeNull()
    })

    it('returns a null replyTo when the message is not a reply', () => {
      const message = createMessageSummary({ replyTo: null })

      const view = presenter.toView(message)

      expect(view.replyTo).toBeNull()
    })

    it('shows the reply target content when it has not been deleted', () => {
      const message = createMessageSummary({ replyTo: { id: 'reply-1', content: 'original', senderId: 'user-2', deletedAt: null } })

      const view = presenter.toView(message)

      expect(view.replyTo).toEqual({ id: 'reply-1', content: 'original', senderId: 'user-2' })
    })

    it('masks the reply target content when it has been deleted, independent of the reply message itself', () => {
      const message = createMessageSummary({ replyTo: { id: 'reply-1', content: 'original', senderId: 'user-2', deletedAt: new Date() } })

      const view = presenter.toView(message)

      expect(view.replyTo).toEqual({ id: 'reply-1', content: null, senderId: 'user-2' })
    })
  })
})
