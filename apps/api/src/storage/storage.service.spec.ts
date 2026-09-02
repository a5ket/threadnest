import { BucketAlreadyExists, BucketAlreadyOwnedByYou, DeleteObjectCommand, NoSuchKey, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { StorageService } from './storage.service'

const mockSend = jest.fn()

jest.mock('@aws-sdk/client-s3', () => {
  const actual = jest.requireActual('@aws-sdk/client-s3')
  return {
    ...actual,
    S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  }
})

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}))

describe('StorageService', () => {
  const config = {
    getOrThrow: jest.fn((key: string) => {
      const values: Record<string, unknown> = {
        storageEndpoint: 'https://storage.test',
        storageRegion: 'auto',
        storageAccessKeyId: 'key',
        storageSecretAccessKey: 'secret',
        storageForcePathStyle: true,
        storageBucket: 'threadnest',
        storagePublicUrl: 'https://cdn.test/',
      }
      return values[key]
    }),
  }

  const service = new StorageService(config as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('getPublicUrl', () => {
    it('strips the trailing slash from the configured public URL', () => {
      expect(service.getPublicUrl('avatars/user-1/a.webp')).toBe('https://cdn.test/avatars/user-1/a.webp')
    })
  })

  describe('getKeyFromUrl', () => {
    it('extracts the key when the URL matches the public URL prefix', () => {
      expect(service.getKeyFromUrl('https://cdn.test/avatars/user-1/a.webp')).toBe('avatars/user-1/a.webp')
    })

    it('returns null for a URL from a different host', () => {
      expect(service.getKeyFromUrl('https://other-cdn.test/avatars/user-1/a.webp')).toBeNull()
    })

    it('returns null for a null URL', () => {
      expect(service.getKeyFromUrl(null)).toBeNull()
    })
  })

  describe('upload', () => {
    it('sends a PutObjectCommand and returns the public URL', async () => {
      mockSend.mockResolvedValue({})

      const result = await service.upload('avatars/user-1/a.webp', Buffer.from('data'), 'image/webp')

      expect(mockSend).toHaveBeenCalledWith(expect.any(PutObjectCommand))
      expect(result).toBe('https://cdn.test/avatars/user-1/a.webp')
    })
  })

  describe('delete', () => {
    it('sends a DeleteObjectCommand', async () => {
      mockSend.mockResolvedValue({})

      await service.delete('avatars/user-1/a.webp')

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand))
    })

    it('swallows a NoSuchKey error', async () => {
      mockSend.mockRejectedValue(new NoSuchKey({ $metadata: {}, message: 'not found' }))

      await expect(service.delete('missing-key')).resolves.toBeUndefined()
    })

    it('propagates any other error', async () => {
      mockSend.mockRejectedValue(new Error('network error'))

      await expect(service.delete('avatars/user-1/a.webp')).rejects.toThrow('network error')
    })
  })

  describe('deleteByUrl', () => {
    it('deletes the object when the URL resolves to a known key', async () => {
      mockSend.mockResolvedValue({})

      await service.deleteByUrl('https://cdn.test/avatars/user-1/a.webp')

      expect(mockSend).toHaveBeenCalledWith(expect.any(DeleteObjectCommand))
    })

    it('does nothing for a URL that does not resolve to a key', async () => {
      await service.deleteByUrl('https://other-cdn.test/avatars/user-1/a.webp')

      expect(mockSend).not.toHaveBeenCalled()
    })

    it('does nothing for a null URL', async () => {
      await service.deleteByUrl(null)

      expect(mockSend).not.toHaveBeenCalled()
    })
  })

  describe('getPresignedUrl', () => {
    it('delegates to the SDK presigner with the configured expiry', async () => {
      (getSignedUrl as jest.Mock).mockResolvedValue('https://storage.test/signed-url')

      const result = await service.getPresignedUrl('attachments/user-1/a.webp')

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 25 * 60 * 60 }),
      )
      expect(result).toBe('https://storage.test/signed-url')
    })
  })

  describe('onModuleInit', () => {
    it('sets the public-read policy when the bucket already exists', async () => {
      mockSend.mockResolvedValueOnce({})
      mockSend.mockResolvedValueOnce({})

      await service.onModuleInit()

      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    it('creates the bucket then sets the policy when the bucket does not exist', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('not found'))
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})

      await service.onModuleInit()

      expect(mockSend).toHaveBeenCalledTimes(3)
    })

    it('still sets the policy when bucket creation fails because it is already owned by this account', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new BucketAlreadyOwnedByYou({ $metadata: {}, message: 'exists' }))
        .mockResolvedValueOnce({})

      await service.onModuleInit()

      expect(mockSend).toHaveBeenCalledTimes(3)
    })

    it('still sets the policy when bucket creation fails because another process already created it', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new BucketAlreadyExists({ $metadata: {}, message: 'exists' }))
        .mockResolvedValueOnce({})

      await service.onModuleInit()

      expect(mockSend).toHaveBeenCalledTimes(3)
    })

    it('does not set a policy when bucket creation fails for an unrelated reason', async () => {
      mockSend
        .mockRejectedValueOnce(new Error('not found'))
        .mockRejectedValueOnce(new Error('access denied'))

      await expect(service.onModuleInit()).resolves.toBeUndefined()

      expect(mockSend).toHaveBeenCalledTimes(2)
    })

    it('does not throw when setting the public-read policy fails', async () => {
      mockSend
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('policy denied'))

      await expect(service.onModuleInit()).resolves.toBeUndefined()
    })
  })
})
