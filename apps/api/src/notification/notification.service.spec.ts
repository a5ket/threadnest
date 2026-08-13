import { NotificationType } from 'generated/prisma/enums'
import { createMockNotificationPresenter } from 'test/factories/notification-presenter.mock-factory'
import { createMockNotificationRepository } from 'test/factories/notification-repository.mock-factory'
import { createNotificationSummary } from 'test/factories/notification-summary.factory'
import { NotificationService } from './notification.service'

describe('NotificationService', () => {
  const notificationsRepo = createMockNotificationRepository()
  const presenter = createMockNotificationPresenter()

  const service = new NotificationService(
    notificationsRepo as any,
    presenter,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('create', () => {
    it('creates the notification and presents it', async () => {
      const notification = createNotificationSummary()
      const view = { id: 'view-1' }
      const data = { nestSlug: 'nest-slug', nestName: 'Nest', threadSlug: 'thread-slug', threadTitle: 'Thread title', commentId: 'comment-1', commentExcerpt: 'hello' }

      notificationsRepo.create.mockResolvedValue(notification)
      presenter.toResponseView.mockReturnValue(view as any)

      const result = await service.create('user-1', 'actor-1', 'nest-1', NotificationType.THREAD_REPLY, data)

      expect(notificationsRepo.create).toHaveBeenCalledWith('user-1', 'actor-1', 'nest-1', NotificationType.THREAD_REPLY, data)
      expect(presenter.toResponseView).toHaveBeenCalledWith(notification)
      expect(result).toBe(view)
    })
  })

  describe('listForUser', () => {
    it('presents each notification in the page and passes through pagination meta', async () => {
      const notifications = [createNotificationSummary({ id: 'n-1' }), createNotificationSummary({ id: 'n-2' })]
      const view = { id: 'view' }
      const query = { limit: 20, unreadOnly: false }

      notificationsRepo.listForUser.mockResolvedValue({ items: notifications, meta: { nextCursor: 'cursor-1', hasMore: true } })
      presenter.toResponseView.mockReturnValue(view as any)

      const result = await service.listForUser('user-1', query)

      expect(notificationsRepo.listForUser).toHaveBeenCalledWith('user-1', query)
      expect(presenter.toResponseView).toHaveBeenCalledTimes(2)
      expect(result).toEqual({ items: [view, view], meta: { nextCursor: 'cursor-1', hasMore: true } })
    })
  })

  describe('getUnseenCount', () => {
    it('delegates to the repository', async () => {
      notificationsRepo.countUnseen.mockResolvedValue(3)

      const result = await service.getUnseenCount('user-1')

      expect(notificationsRepo.countUnseen).toHaveBeenCalledWith('user-1')
      expect(result).toBe(3)
    })
  })

  describe('markAsRead', () => {
    it('delegates to the repository, scoped to the owning user', async () => {
      await service.markAsRead('notification-1', 'user-1')

      expect(notificationsRepo.markAsRead).toHaveBeenCalledWith('notification-1', 'user-1')
    })
  })

  describe('markAllAsRead', () => {
    it('delegates to the repository', async () => {
      await service.markAllAsRead('user-1')

      expect(notificationsRepo.markAllAsRead).toHaveBeenCalledWith('user-1')
    })
  })

  describe('markAllAsSeen', () => {
    it('delegates to the repository', async () => {
      await service.markAllAsSeen('user-1')

      expect(notificationsRepo.markAllAsSeen).toHaveBeenCalledWith('user-1')
    })
  })
})
