import { NestBanRepository } from 'src/nest/ban/nest-ban.repository'

export const createMockNestBanRepository = (): jest.Mocked<Pick<NestBanRepository, 'existsActive' | 'create' | 'revoke' | 'listSummaryByNestId'>> => ({
  existsActive: jest.fn(),
  create: jest.fn(),
  revoke: jest.fn(),
  listSummaryByNestId: jest.fn(),
})
