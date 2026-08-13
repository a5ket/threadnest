import { NotificationPresenter } from 'src/notification/notification.presenter'

export const createMockNotificationPresenter = (): jest.Mocked<Pick<NotificationPresenter, 'toResponseView'>> => ({
  toResponseView: jest.fn(),
})
