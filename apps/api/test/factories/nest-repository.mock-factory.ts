import { NestRepository } from 'src/nest/nest.repository'

export const createMockNestRepository = (): jest.Mocked<Pick<NestRepository, 'getBySlug' | 'getDeletedAt'>> => ({
  getBySlug: jest.fn(),
  getDeletedAt: jest.fn().mockResolvedValue(null),
})
