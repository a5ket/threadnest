import { createMockCommentService } from 'test/factories/comment-service.mock-factory'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { createMockThreadService } from 'test/factories/thread-service.mock-factory'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformContentPolicy } from './platform-content.policy'
import { PlatformContentService } from './platform-content.service'

describe('PlatformContentService', () => {
  const platformAccess = createMockPlatformAccess()
  const policy = new PlatformContentPolicy(platformAccess as any)
  const threads = createMockThreadService()
  const comments = createMockCommentService()

  const service = new PlatformContentService(policy, threads as any, comments as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('removeThread', () => {
    it('removes the thread once the actor is a moderator', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))
      threads.removeByPlatform.mockResolvedValue(undefined)

      await service.removeThread('thread-1', 'actor-1')

      expect(threads.removeByPlatform).toHaveBeenCalledWith('thread-1', 'actor-1')
    })

    it('propagates the permission failure and never removes the thread', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(service.removeThread('thread-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(threads.removeByPlatform).not.toHaveBeenCalled()
    })
  })

  describe('removeComment', () => {
    it('removes the comment once the actor is a moderator', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))
      comments.removeByPlatform.mockResolvedValue(undefined)

      await service.removeComment('comment-1', 'actor-1')

      expect(comments.removeByPlatform).toHaveBeenCalledWith('comment-1', 'actor-1')
    })

    it('propagates the permission failure and never removes the comment', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(service.removeComment('comment-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(comments.removeByPlatform).not.toHaveBeenCalled()
    })
  })

  describe('removeAllContentByUser', () => {
    it('removes all threads and comments for the user once the actor is a moderator, and returns the counts', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))
      threads.removeAllByAuthorPlatform.mockResolvedValue(3)
      comments.removeAllByAuthorPlatform.mockResolvedValue(7)

      const result = await service.removeAllContentByUser('user-1', 'actor-1')

      expect(threads.removeAllByAuthorPlatform).toHaveBeenCalledWith('user-1', 'actor-1')
      expect(comments.removeAllByAuthorPlatform).toHaveBeenCalledWith('user-1', 'actor-1')
      expect(result).toEqual({ threadsRemoved: 3, commentsRemoved: 7 })
    })

    it('propagates the permission failure and never removes anything', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(service.removeAllContentByUser('user-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(threads.removeAllByAuthorPlatform).not.toHaveBeenCalled()
      expect(comments.removeAllByAuthorPlatform).not.toHaveBeenCalled()
    })
  })
})
