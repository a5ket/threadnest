import { InternalServerErrorException } from '@nestjs/common'
import { createMockImageProcessor } from 'test/factories/image-processor.mock-factory'
import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createMockUserPreferenceService } from 'test/factories/user-preference-service.mock-factory'
import { createUserProfile } from 'test/factories/user-profile.factory'
import { createMockUserProfileRepository } from 'test/factories/user-profile-repository.mock-factory'
import { createMockUserRepository } from 'test/factories/user-repository.mock-factory'
import { UsernameTakenException } from './exceptions/username-taken.exception'
import { UserNotFoundException } from './exceptions/user-not-found.exception'
import { UserService } from './user.service'

describe('UserService', () => {
  const repo = createMockUserRepository()
  const profileRepo = createMockUserProfileRepository()
  const preferences = createMockUserPreferenceService()
  const storage = createMockStorageService()
  const imageProcessor = createMockImageProcessor()
  const prisma = { $transaction: jest.fn((callback: (tx: any) => Promise<any>) => callback({} as any)) }

  const service = new UserService(
    repo as any,
    profileRepo as any,
    preferences as any,
    prisma as any,
    storage as any,
    imageProcessor,
  )

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertUserExists', () => {
    it('does not throw when the user exists', async () => {
      repo.exists.mockResolvedValue(true)

      await expect(service.assertUserExists('user-1')).resolves.toBeUndefined()
    })

    it('throws UserNotFoundException when the user does not exist', async () => {
      repo.exists.mockResolvedValue(false)

      await expect(service.assertUserExists('user-1')).rejects.toThrow(UserNotFoundException)
    })
  })

  describe('getProfile', () => {
    it('presents the profile with a public avatar URL derived from the key', async () => {
      profileRepo.getByUserId.mockResolvedValue(createUserProfile({ avatarKey: 'avatars/user-1/a.webp' }))

      const result = await service.getProfile('user-1')

      expect(result).toMatchObject({ avatarUrl: 'https://cdn.test/avatars/user-1/a.webp', activityVisible: true })
      expect(result).not.toHaveProperty('avatarKey')
    })

    it('returns a null avatar URL when the profile has no avatar', async () => {
      profileRepo.getByUserId.mockResolvedValue(createUserProfile({ avatarKey: null }))

      const result = await service.getProfile('user-1')

      expect(result.avatarUrl).toBeNull()
    })
  })

  describe('getProfileByUsername', () => {
    it('is always visible to the profile owner regardless of the preference', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      const result = await service.getProfileByUsername('happy_otter1234', 'user-1')

      expect(result.activityVisible).toBe(true)
    })

    it('follows the target user\'s preference for other viewers', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      const result = await service.getProfileByUsername('happy_otter1234', 'viewer-2')

      expect(result.activityVisible).toBe(false)
    })

    it('does not check the preference for an anonymous viewer when it is otherwise irrelevant', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })

      const result = await service.getProfileByUsername('happy_otter1234', undefined)

      expect(result.activityVisible).toBe(true)
    })
  })

  describe('search', () => {
    it('presents every result profile', async () => {
      const page = { items: [createUserProfile({ userId: 'user-1' }), createUserProfile({ userId: 'user-2' })], meta: { nextCursor: null, hasMore: false } }
      profileRepo.search.mockResolvedValue(page as any)

      const result = await service.search({} as any)

      expect(result.items).toHaveLength(2)
      expect(result.items[0]).toHaveProperty('avatarUrl')
      expect(result.meta).toBe(page.meta)
    })
  })

  describe('updateProfile', () => {
    it('throws UsernameTakenException without updating when the new username is taken', async () => {
      profileRepo.isUsernameTaken.mockResolvedValue(true)

      await expect(service.updateProfile('user-1', { username: 'taken_name123' } as any)).rejects.toThrow(UsernameTakenException)

      expect(profileRepo.update).not.toHaveBeenCalled()
    })

    it('updates the profile once the username is confirmed free', async () => {
      profileRepo.isUsernameTaken.mockResolvedValue(false)
      profileRepo.update.mockResolvedValue(createUserProfile({ username: 'free_name123' }))

      await service.updateProfile('user-1', { username: 'free_name123' })

      expect(profileRepo.isUsernameTaken).toHaveBeenCalledWith('free_name123', 'user-1')
      expect(profileRepo.update).toHaveBeenCalledWith('user-1', { username: 'free_name123' })
    })

    it('skips the username-taken check entirely when the dto omits a username', async () => {
      profileRepo.update.mockResolvedValue(createUserProfile())

      await service.updateProfile('user-1', { displayName: 'New name' })

      expect(profileRepo.isUsernameTaken).not.toHaveBeenCalled()
    })
  })

  describe('updateAvatar', () => {
    it('uploads the processed avatar and deletes the previous one when it existed', async () => {
      profileRepo.getByUserId.mockResolvedValue(createUserProfile({ avatarKey: 'avatars/user-1/old.webp' }))
      profileRepo.updateAvatarKey.mockResolvedValue(createUserProfile({ avatarKey: 'avatars/user-1/new.webp' }))

      await service.updateAvatar('user-1', Buffer.from('raw'))

      expect(imageProcessor.toSquareWebp).toHaveBeenCalledWith(Buffer.from('raw'), 512)
      expect(storage.upload).toHaveBeenCalledWith(expect.stringMatching(/^avatars\/user-1\//), Buffer.from('processed'), 'image/webp')
      expect(storage.delete).toHaveBeenCalledWith('avatars/user-1/old.webp')
    })

    it('does not attempt to delete a previous avatar when none existed', async () => {
      profileRepo.getByUserId.mockResolvedValue(createUserProfile({ avatarKey: null }))
      profileRepo.updateAvatarKey.mockResolvedValue(createUserProfile({ avatarKey: 'avatars/user-1/new.webp' }))

      await service.updateAvatar('user-1', Buffer.from('raw'))

      expect(storage.delete).not.toHaveBeenCalled()
    })
  })

  describe('removeAvatar', () => {
    it('clears the avatar key and deletes the stored file when one existed', async () => {
      profileRepo.getByUserId.mockResolvedValue(createUserProfile({ avatarKey: 'avatars/user-1/old.webp' }))
      profileRepo.updateAvatarKey.mockResolvedValue(createUserProfile({ avatarKey: null }))

      await service.removeAvatar('user-1')

      expect(profileRepo.updateAvatarKey).toHaveBeenCalledWith('user-1', null)
      expect(storage.delete).toHaveBeenCalledWith('avatars/user-1/old.webp')
    })

    it('does not attempt to delete when there was no avatar', async () => {
      profileRepo.getByUserId.mockResolvedValue(createUserProfile({ avatarKey: null }))
      profileRepo.updateAvatarKey.mockResolvedValue(createUserProfile({ avatarKey: null }))

      await service.removeAvatar('user-1')

      expect(storage.delete).not.toHaveBeenCalled()
    })
  })

  describe('create', () => {
    it('creates the user and profile with a freshly generated username inside a transaction', async () => {
      profileRepo.isUsernameTaken.mockResolvedValue(false)
      repo.create.mockResolvedValue({ id: 'user-1', email: 'a@b.com', createdAt: new Date() })
      profileRepo.create.mockResolvedValue(createUserProfile({ userId: 'user-1' }))

      const result = await service.create('a@b.com', 'hashed')

      expect(prisma.$transaction).toHaveBeenCalled()
      expect(repo.create).toHaveBeenCalledWith('a@b.com', 'hashed', {})
      const [, generatedUsername] = profileRepo.create.mock.calls[0]
      expect(profileRepo.create).toHaveBeenCalledWith('user-1', generatedUsername, {})
      expect(result).toMatchObject({ id: 'user-1', profile: expect.any(Object) })
    })

    it('retries generation until an available username is found', async () => {
      profileRepo.isUsernameTaken.mockResolvedValueOnce(true).mockResolvedValueOnce(true).mockResolvedValueOnce(false)
      repo.create.mockResolvedValue({ id: 'user-1', email: 'a@b.com', createdAt: new Date() })
      profileRepo.create.mockResolvedValue(createUserProfile({ userId: 'user-1' }))

      await service.create('a@b.com', 'hashed')

      expect(profileRepo.isUsernameTaken).toHaveBeenCalledTimes(3)
    })

    it('throws after failing to find an available username within the retry budget', async () => {
      profileRepo.isUsernameTaken.mockResolvedValue(true)

      await expect(service.create('a@b.com', 'hashed')).rejects.toThrow(InternalServerErrorException)

      expect(profileRepo.isUsernameTaken).toHaveBeenCalledTimes(5)
      expect(repo.create).not.toHaveBeenCalled()
    })
  })
})
