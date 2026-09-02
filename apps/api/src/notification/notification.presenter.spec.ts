import { NotificationType } from 'generated/prisma/enums'
import { UserPresenter } from 'src/user/user.presenter'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { NotificationSummary } from './types/notification.summary'
import { NotificationPresenter } from './notification.presenter'

describe('NotificationPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new NotificationPresenter(new UserPresenter(storage as any))

  const baseNotification = (overrides: Partial<NotificationSummary> = {}): NotificationSummary => ({
    id: 'notification-1',
    type: NotificationType.THREAD_REPLY,
    data: { threadId: 'thread-1', threadSlug: 'thread-slug', nestSlug: 'nest-slug' },
    readAt: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    actor: { id: 'actor-1', profile: null },
    ...overrides,
  })

  describe('toResponseView', () => {
    it('resolves the actor as a user reference when present', () => {
      const notification = baseNotification({ actor: { id: 'actor-1', profile: null } })

      const view = presenter.toResponseView(notification)

      expect(view.actor).toMatchObject({ id: 'actor-1' })
    })

    it('returns a null actor for system-generated notifications', () => {
      const notification = baseNotification({ actor: null })

      const view = presenter.toResponseView(notification)

      expect(view.actor).toBeNull()
    })

    it('merges the notification type into the data payload', () => {
      const notification = baseNotification({
        type: NotificationType.JOIN_REQUEST_APPROVED,
        data: { nestSlug: 'nest-slug' },
      })

      const view = presenter.toResponseView(notification)

      expect(view.data).toEqual({ type: NotificationType.JOIN_REQUEST_APPROVED, nestSlug: 'nest-slug' })
    })

    it('carries id, readAt, and createdAt through unchanged', () => {
      const readAt = new Date('2024-01-02T00:00:00.000Z')
      const notification = baseNotification({ id: 'notification-2', readAt })

      const view = presenter.toResponseView(notification)

      expect(view.id).toBe('notification-2')
      expect(view.readAt).toBe(readAt)
      expect(view.createdAt).toEqual(new Date('2024-01-01T00:00:00.000Z'))
    })
  })
})
