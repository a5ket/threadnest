import { ThreadRepository } from 'src/thread/thread.repository'

export const createMockThreadRepository = (): jest.Mocked<Pick<ThreadRepository, 'getById' | 'getBySlug' | 'create' | 'listByNest' | 'searchGlobal' | 'listDiscoverFeed' | 'updateById' | 'softDelete' | 'listActiveByAuthor' | 'softDeleteManyByAuthor' | 'lock' | 'unlock' | 'pin' | 'unpin' | 'adjustScore' | 'listSaved' | 'listFeed' | 'listByAuthor' | 'adjustCommentCount' | 'updateLastCommentAt'>> => ({
  getById: jest.fn(),
  getBySlug: jest.fn(),
  create: jest.fn(),
  listByNest: jest.fn(),
  searchGlobal: jest.fn(),
  listDiscoverFeed: jest.fn(),
  updateById: jest.fn(),
  softDelete: jest.fn(),
  listActiveByAuthor: jest.fn(),
  softDeleteManyByAuthor: jest.fn(),
  lock: jest.fn(),
  unlock: jest.fn(),
  pin: jest.fn(),
  unpin: jest.fn(),
  adjustScore: jest.fn(),
  listSaved: jest.fn(),
  listFeed: jest.fn(),
  listByAuthor: jest.fn(),
  adjustCommentCount: jest.fn(),
  updateLastCommentAt: jest.fn(),
})
