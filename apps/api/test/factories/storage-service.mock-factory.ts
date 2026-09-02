import { StorageService } from 'src/storage/storage.service'

export const createMockStorageService = (): jest.Mocked<Pick<StorageService, 'getPublicUrl' | 'getPresignedUrl' | 'upload' | 'delete' | 'deleteByUrl' | 'getKeyFromUrl'>> => ({
  getPublicUrl: jest.fn((key: string) => `https://cdn.test/${key}`),
  getPresignedUrl: jest.fn((key: string) => Promise.resolve(`https://cdn.test/presigned/${key}`)),
  upload: jest.fn(),
  delete: jest.fn(),
  deleteByUrl: jest.fn(),
  getKeyFromUrl: jest.fn(),
})
