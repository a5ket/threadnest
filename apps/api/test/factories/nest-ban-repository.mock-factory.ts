import { NestBanRepository } from 'src/nest/ban/nest-ban.repository'

export const createMockNestBanRepository = (): jest.Mocked<Pick<NestBanRepository, 'existsActive'>> => ({
  existsActive: jest.fn(),
})
