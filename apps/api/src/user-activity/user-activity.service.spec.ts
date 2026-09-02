import { encodeCursor } from 'src/common/pagination/cursor'
import { createMockCommentService } from 'test/factories/comment-service.mock-factory'
import { createMockThreadService } from 'test/factories/thread-service.mock-factory'
import { createMockUserPreferenceService } from 'test/factories/user-preference-service.mock-factory'
import { createUserProfile } from 'test/factories/user-profile.factory'
import { createMockUserProfileRepository } from 'test/factories/user-profile-repository.mock-factory'
import { UserActivityItemType } from './dto/user-activity-item-response.dto'
import { UserActivityService } from './user-activity.service'

describe('UserActivityService', () => {
  const profileRepo = createMockUserProfileRepository()
  const preferences = createMockUserPreferenceService()
  const threads = createMockThreadService()
  const comments = createMockCommentService()

  const service = new UserActivityService(profileRepo as any, preferences as any, threads as any, comments as any)

  const emptyPage = { items: [], meta: { nextCursor: null, hasMore: false } }

  beforeEach(() => {
    jest.clearAllMocks()
    threads.listByAuthor.mockResolvedValue(emptyPage)
    comments.listByAuthor.mockResolvedValue(emptyPage)
  })

  describe('listActivity', () => {
    it('is always visible to the profile owner regardless of the preference', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      await service.listActivity('happy_otter1234', 'user-1', { limit: 20 })

      expect(threads.listByAuthor).toHaveBeenCalledWith('user-1', 'user-1', { limit: 21, cursor: undefined })
    })

    it('returns an empty page without querying threads or comments when the profile is private to this viewer', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      const result = await service.listActivity('happy_otter1234', 'viewer-2', { limit: 20 })

      expect(result).toEqual(emptyPage)
      expect(threads.listByAuthor).not.toHaveBeenCalled()
      expect(comments.listByAuthor).not.toHaveBeenCalled()
    })

    it('returns an empty page for an anonymous viewer when the profile is private', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: false })

      const result = await service.listActivity('happy_otter1234', undefined, { limit: 20 })

      expect(result).toEqual(emptyPage)
    })

    it('fetches activity when the profile is public', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })

      await service.listActivity('happy_otter1234', 'viewer-2', { limit: 20 })

      expect(threads.listByAuthor).toHaveBeenCalledWith('user-1', 'viewer-2', { limit: 21, cursor: undefined })
      expect(comments.listByAuthor).toHaveBeenCalledWith('user-1', 'viewer-2', { limit: 21, cursor: undefined })
    })

    it('merges threads and comments in descending createdAt order', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })
      threads.listByAuthor.mockResolvedValue({
        items: [{ id: 'thread-1', createdAt: new Date('2024-01-03T00:00:00.000Z') }],
        meta: { nextCursor: null, hasMore: false },
      } as any)
      comments.listByAuthor.mockResolvedValue({
        items: [
          { id: 'comment-1', createdAt: new Date('2024-01-02T00:00:00.000Z') },
          { id: 'comment-2', createdAt: new Date('2024-01-04T00:00:00.000Z') },
        ],
        meta: { nextCursor: null, hasMore: false },
      } as any)

      const result = await service.listActivity('happy_otter1234', 'viewer-2', { limit: 20 })

      expect(result.items.map((i) => i.id)).toEqual(['comment-2', 'thread-1', 'comment-1'])
      expect(result.items[0].type).toBe(UserActivityItemType.COMMENT)
      expect(result.items[1].type).toBe(UserActivityItemType.THREAD)
    })

    it('breaks ties on equal createdAt by descending id', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })
      const sameTime = new Date('2024-01-03T00:00:00.000Z')
      threads.listByAuthor.mockResolvedValue({
        items: [{ id: 'a', createdAt: sameTime }],
        meta: { nextCursor: null, hasMore: false },
      } as any)
      comments.listByAuthor.mockResolvedValue({
        items: [{ id: 'b', createdAt: sameTime }],
        meta: { nextCursor: null, hasMore: false },
      } as any)

      const result = await service.listActivity('happy_otter1234', 'viewer-2', { limit: 20 })

      expect(result.items.map((i) => i.id)).toEqual(['b', 'a'])
    })

    it('reports hasMore and a matching nextCursor when combined candidates exceed the requested limit', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })
      threads.listByAuthor.mockResolvedValue({
        items: [
          { id: 't1', createdAt: new Date('2024-01-03T00:00:00.000Z') },
          { id: 't2', createdAt: new Date('2024-01-02T00:00:00.000Z') },
        ],
        meta: { nextCursor: null, hasMore: false },
      } as any)
      comments.listByAuthor.mockResolvedValue({
        items: [{ id: 'c1', createdAt: new Date('2024-01-01T00:00:00.000Z') }],
        meta: { nextCursor: null, hasMore: false },
      } as any)

      const result = await service.listActivity('happy_otter1234', 'viewer-2', { limit: 2 })

      expect(result.items.map((i) => i.id)).toEqual(['t1', 't2'])
      expect(result.meta.hasMore).toBe(true)
      expect(result.meta.nextCursor).toBe(encodeCursor(new Date('2024-01-02T00:00:00.000Z'), 't2'))
    })

    it('reports hasMore false and a null nextCursor when everything fits within the limit', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })
      threads.listByAuthor.mockResolvedValue({
        items: [{ id: 't1', createdAt: new Date('2024-01-03T00:00:00.000Z') }],
        meta: { nextCursor: null, hasMore: false },
      } as any)

      const result = await service.listActivity('happy_otter1234', 'viewer-2', { limit: 20 })

      expect(result.meta.hasMore).toBe(false)
      expect(result.meta.nextCursor).toBeNull()
    })

    it('forwards the pagination cursor and requests one extra item to detect a next page', async () => {
      profileRepo.getByUsername.mockResolvedValue(createUserProfile({ userId: 'user-1' }))
      preferences.get.mockResolvedValue({ userId: 'user-1', showActivityOnProfile: true })

      await service.listActivity('happy_otter1234', 'viewer-2', { limit: 5, cursor: 'abc' })

      expect(threads.listByAuthor).toHaveBeenCalledWith('user-1', 'viewer-2', { limit: 6, cursor: 'abc' })
      expect(comments.listByAuthor).toHaveBeenCalledWith('user-1', 'viewer-2', { limit: 6, cursor: 'abc' })
    })
  })
})
