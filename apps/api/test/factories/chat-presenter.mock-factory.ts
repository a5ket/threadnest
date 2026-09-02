import { ChatPresenter } from 'src/chat/chat.presenter'

export const createMockChatPresenter = (): jest.Mocked<Pick<ChatPresenter, 'toSummaryView' | 'toDetailView'>> => ({
  toSummaryView: jest.fn(),
  toDetailView: jest.fn(),
})
