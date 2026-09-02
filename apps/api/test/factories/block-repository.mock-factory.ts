import { BlockRepository } from 'src/block/block.repository'

export const createMockBlockRepository = (): jest.Mocked<Pick<BlockRepository, 'exists' | 'getByUsers' | 'create' | 'deleteByUsers' | 'createAndSelectBlockedUser' | 'getBlockedUserById' | 'listBlockedUsers'>> => ({
  exists: jest.fn(),
  getByUsers: jest.fn(),
  create: jest.fn(),
  deleteByUsers: jest.fn(),
  createAndSelectBlockedUser: jest.fn(),
  getBlockedUserById: jest.fn(),
  listBlockedUsers: jest.fn(),
})
