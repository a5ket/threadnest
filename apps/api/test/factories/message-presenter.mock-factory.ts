import { MessagePresenter } from 'src/chat/message/message.presenter'

export const createMockMessagePresenter = (): jest.Mocked<Pick<MessagePresenter, 'toView'>> => ({
  toView: jest.fn(),
})
