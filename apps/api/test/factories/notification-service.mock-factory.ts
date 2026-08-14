import { NotificationService } from 'src/notification/notification.service'

export const createMockNotificationService = (): jest.Mocked<Pick<NotificationService, 'create'>> => ({
  create: jest.fn(),
})
