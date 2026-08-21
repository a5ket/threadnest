import { Injectable } from '@nestjs/common'
import { encodeCursor } from 'src/common/pagination/cursor'
import { CommentService } from 'src/comment/comment.service'
import { ThreadService } from 'src/thread/thread.service'
import { UserPreferenceService } from 'src/user/preferences/user-preference.service'
import { UserProfileRepository } from 'src/user/user-profile.repository'
import { UserActivityItemType } from './dto/user-activity-item-response.dto'
import { UserActivityQueryDto } from './dto/user-activity.query.dto'

const EMPTY_PAGE = { items: [], meta: { nextCursor: null, hasMore: false } }

@Injectable()
export class UserActivityService {
  constructor(
    private readonly profileRepo: UserProfileRepository,
    private readonly preferences: UserPreferenceService,
    private readonly threads: ThreadService,
    private readonly comments: CommentService
  ) { }

  private async resolveVisibleAuthorId(username: string, viewerId: string | undefined) {
    const profile = await this.profileRepo.getByUsername(username)

    if (viewerId === profile.userId) {
      return profile.userId
    }

    const preference = await this.preferences.get(profile.userId)

    return preference.showActivityOnProfile ? profile.userId : null
  }

  async listActivity(username: string, viewerId: string | undefined, query: UserActivityQueryDto) {
    const authorId = await this.resolveVisibleAuthorId(username, viewerId)

    if (!authorId) {
      return EMPTY_PAGE
    }

    const candidateQuery = { limit: query.limit + 1, cursor: query.cursor }

    const [threadPage, commentPage] = await Promise.all([
      this.threads.listByAuthor(authorId, viewerId, candidateQuery),
      this.comments.listByAuthor(authorId, viewerId, candidateQuery)
    ])

    const candidates = [
      ...threadPage.items.map((thread) => ({ type: UserActivityItemType.THREAD, id: thread.id, createdAt: thread.createdAt, thread })),
      ...commentPage.items.map((comment) => ({ type: UserActivityItemType.COMMENT, id: comment.id, createdAt: comment.createdAt, comment }))
    ]

    candidates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || b.id.localeCompare(a.id))

    const hasMore = candidates.length > query.limit
    const page = hasMore ? candidates.slice(0, query.limit) : candidates
    const last = page.at(-1)

    const nextCursor = last && hasMore ? encodeCursor(last.createdAt, last.id) : null

    return { items: page, meta: { nextCursor, hasMore } }
  }
}
