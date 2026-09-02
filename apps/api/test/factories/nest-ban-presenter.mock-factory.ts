import { NestBanPresenter } from 'src/nest/ban/nest-ban.presenter'

export const createMockNestBanPresenter = (): jest.Mocked<Pick<NestBanPresenter, 'toSummaryView'>> => ({
  toSummaryView: jest.fn(),
})
