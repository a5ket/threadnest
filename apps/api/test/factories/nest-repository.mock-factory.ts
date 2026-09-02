import { NestRepository } from 'src/nest/nest.repository'

export const createMockNestRepository = (): jest.Mocked<Pick<NestRepository, 'getBySlug' | 'getDeletedAt' | 'adjustMemberCount' | 'create' | 'updateMetadata' | 'updateIconKey' | 'delete' | 'slugExists' | 'listDiscoverable' | 'adjustBalanceCents' | 'getBalanceCents' | 'adjustThreadCount'>> => ({
  getBySlug: jest.fn(),
  getDeletedAt: jest.fn().mockResolvedValue(null),
  adjustMemberCount: jest.fn(),
  create: jest.fn(),
  updateMetadata: jest.fn(),
  updateIconKey: jest.fn(),
  delete: jest.fn(),
  slugExists: jest.fn(),
  listDiscoverable: jest.fn(),
  adjustBalanceCents: jest.fn(),
  getBalanceCents: jest.fn(),
  adjustThreadCount: jest.fn(),
})
