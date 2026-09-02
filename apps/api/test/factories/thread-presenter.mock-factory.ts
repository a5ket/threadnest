import { ThreadPresenter } from 'src/thread/thread.presenter'

export const createMockThreadPresenter = (): jest.Mocked<Pick<ThreadPresenter, 'toSummaryView' | 'toSearchResultView' | 'toDetailView'>> => ({
  toSummaryView: jest.fn(),
  toSearchResultView: jest.fn(),
  toDetailView: jest.fn(),
})
