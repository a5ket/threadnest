import { StorageService } from 'src/storage/storage.service'

export const createMockStorageService = (): jest.Mocked<Pick<StorageService, 'getPublicUrl' | 'upload' | 'delete' | 'deleteByUrl' | 'getKeyFromUrl'>> => ({
  getPublicUrl: jest.fn((key: string) => `https://cdn.test/${key}`),
  upload: jest.fn(),
  delete: jest.fn(),
  deleteByUrl: jest.fn(),
  getKeyFromUrl: jest.fn(),
})
