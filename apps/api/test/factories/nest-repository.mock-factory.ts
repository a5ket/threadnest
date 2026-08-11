import { NestRepository } from 'src/nest/nest.repository'

export const createMockNestRepository = (): jest.Mocked<Pick<NestRepository, 'getBySlug'>> => ({
  getBySlug: jest.fn(),
})
