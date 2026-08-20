import { NotificationType } from 'generated/prisma/enums'
import { NotificationSummary } from 'src/notification/types/notification.summary'

export const createNotificationSummary = (
  overrides: Partial<NotificationSummary> = {},
): NotificationSummary => ({
  id: 'notification-1',
  type: NotificationType.THREAD_REPLY,
  data: { nestSlug: 'nest-slug', nestName: 'Nest', threadSlug: 'thread-slug', threadTitle: 'Thread title', commentId: 'comment-1', commentExcerpt: 'hello' },
  readAt: null,
  createdAt: new Date('2024-01-01T00:00:00.000Z'),
  actor: { id: 'actor-1', profile: { username: 'actor', displayName: null, avatarKey: null } },
  ...overrides,
})
