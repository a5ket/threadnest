import { CacheService } from 'src/cache/cache.service'

export const createMockCacheService = (): jest.Mocked<Pick<CacheService, 'get' | 'set' | 'delete' | 'acquireLock' | 'releaseLock'>> => ({
  get: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
  acquireLock: jest.fn(),
  releaseLock: jest.fn(),
})
