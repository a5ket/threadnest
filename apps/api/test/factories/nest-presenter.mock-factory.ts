import { NestPresenter } from 'src/nest/nest.presenter'

export const createMockNestPresenter = (): jest.Mocked<Pick<NestPresenter, 'toDiscoveryView' | 'toSummaryView' | 'toDetailView' | 'toReferenceView'>> => ({
  toDiscoveryView: jest.fn(),
  toSummaryView: jest.fn(),
  toDetailView: jest.fn(),
  toReferenceView: jest.fn(),
})
