import { NotificationRepository } from 'src/notification/notification.repository'

export const createMockNotificationRepository = (): jest.Mocked<Pick<NotificationRepository,
  'create' | 'listForUser' | 'countUnseen' | 'markAsRead' | 'markAllAsRead' | 'markAllAsSeen'
>> => ({
  create: jest.fn(),
  listForUser: jest.fn(),
  countUnseen: jest.fn(),
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
  markAllAsSeen: jest.fn(),
})
