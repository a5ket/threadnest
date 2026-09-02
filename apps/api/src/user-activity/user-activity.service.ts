import { Injectable } from '@nestjs/common'
import { encodeCursor } from 'src/common/pagination/cursor'
import { CommentService } from 'src/comment/comment.service'
import { ThreadService } from 'src/thread/thread.service'
import { UserPreferenceService } from 'src/user/preferences/user-preference.service'
import { UserProfileRepository } from 'src/user/user-profile.repository'
import { UserActivityItemType } from './dto/user-activity-item-response.dto'
import { UserActivityQueryDto } from './dto/user-activity.query.dto'

const EMPTY_PAGE = { items: [], meta: { nextCursor: null, hasMore: false } }

/** A public-profile feed merging a user's threads and comments into one chronological timeline. */
@Injectable()
export class UserActivityService {
  constructor(
    private readonly profileRepo: UserProfileRepository,
    private readonly preferences: UserPreferenceService,
    private readonly threads: ThreadService,
    private readonly comments: CommentService
  ) { }

  /**
   * A user can always see their own activity; for anyone else, it's gated by the profile owner's
   * `showActivityOnProfile` preference.
   *
   * @param username - The profile being viewed.
   * @param viewerId - The viewer, or `undefined` if anonymous.
   * @returns The profile owner's user id if their activity is visible to this viewer, else `null`.
   * @throws {UserNotFoundException} No profile with this username.
   */
  private async resolveVisibleAuthorId(username: string, viewerId: string | undefined) {
    const profile = await this.profileRepo.getByUsername(username)

    if (viewerId === profile.userId) {
      return profile.userId
    }

    const preference = await this.preferences.get(profile.userId)

    return preference.showActivityOnProfile ? profile.userId : null
  }

  /**
   * Merges threads and comments into one chronological page. Since the two sources are paginated
   * independently, each is over-fetched by one extra item (`query.limit + 1`) before merging and
   * re-trimming, so the combined page can't fall short just because, say, all the newest items
   * happened to be threads.
   *
   * @param username - The profile being viewed.
   * @param viewerId - The viewer, or `undefined` if anonymous.
   * @param query - Pagination options.
   * @returns A cursor-paginated page of thread/comment activity items, newest first. An empty
   * page (not an error) if the profile exists but its activity isn't visible to this viewer.
   * @throws {UserNotFoundException} No profile with this username.
   */
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
