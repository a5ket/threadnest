import { createComment } from 'test/factories/comment.factory'
import { createMockCommentService } from 'test/factories/comment-service.mock-factory'
import { createMockEventBus } from 'test/factories/event-bus.mock-factory'
import { createMockPlatformAccess } from 'test/factories/platform-access.mock-factory'
import { createPlatformAccessContext } from 'test/factories/platform-access-context.factory'
import { createThreadPolicySubject } from 'test/factories/thread-policy-subject.factory'
import { createMockThreadService } from 'test/factories/thread-service.mock-factory'
import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { PlatformContentPolicy } from './platform-content.policy'
import { PlatformContentService } from './platform-content.service'

describe('PlatformContentService', () => {
  const platformAccess = createMockPlatformAccess()
  const policy = new PlatformContentPolicy(platformAccess as any)
  const threads = createMockThreadService()
  const comments = createMockCommentService()
  const eventBus = createMockEventBus()

  const service = new PlatformContentService(policy, threads as any, comments as any, eventBus)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('removeThread', () => {
    it('removes the thread once the actor is a moderator and publishes an event', async () => {
      const thread = createThreadPolicySubject()

      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))
      threads.removeByPlatform.mockResolvedValue(thread)

      await service.removeThread('thread-1', 'actor-1')

      expect(threads.removeByPlatform).toHaveBeenCalledWith('thread-1', 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('propagates the permission failure and never removes the thread', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(service.removeThread('thread-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(threads.removeByPlatform).not.toHaveBeenCalled()
    })
  })

  describe('removeComment', () => {
    it('removes the comment once the actor is a moderator and publishes an event', async () => {
      const comment = createComment()
      const thread = createThreadPolicySubject()

      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))
      comments.removeByPlatform.mockResolvedValue({ comment, thread })

      await service.removeComment('comment-1', 'actor-1')

      expect(comments.removeByPlatform).toHaveBeenCalledWith('comment-1', 'actor-1')
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('propagates the permission failure and never removes the comment', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(service.removeComment('comment-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(comments.removeByPlatform).not.toHaveBeenCalled()
    })
  })

  describe('removeAllContentByUser', () => {
    it('removes all threads and comments for the user once the actor is a moderator, returns the counts, and publishes an event', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))
      threads.removeAllByAuthorPlatform.mockResolvedValue(3)
      comments.removeAllByAuthorPlatform.mockResolvedValue(7)

      const result = await service.removeAllContentByUser('user-1', 'actor-1')

      expect(threads.removeAllByAuthorPlatform).toHaveBeenCalledWith('user-1', 'actor-1')
      expect(comments.removeAllByAuthorPlatform).toHaveBeenCalledWith('user-1', 'actor-1')
      expect(result).toEqual({ threadsRemoved: 3, commentsRemoved: 7 })
      expect(eventBus.publish).toHaveBeenCalledTimes(1)
    })

    it('does not publish an event when nothing was removed', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext({ isModerator: true }))
      threads.removeAllByAuthorPlatform.mockResolvedValue(0)
      comments.removeAllByAuthorPlatform.mockResolvedValue(0)

      await service.removeAllContentByUser('user-1', 'actor-1')

      expect(eventBus.publish).not.toHaveBeenCalled()
    })

    it('propagates the permission failure and never removes anything', async () => {
      platformAccess.getContext.mockResolvedValue(createPlatformAccessContext())

      await expect(service.removeAllContentByUser('user-1', 'actor-1')).rejects.toThrow(InsufficientPermissionsException)

      expect(threads.removeAllByAuthorPlatform).not.toHaveBeenCalled()
      expect(comments.removeAllByAuthorPlatform).not.toHaveBeenCalled()
    })
  })
})
