import { apiClientServer, checkHasSession } from '@/common/server-api-client'
import { getMeFeedListUrl } from '@/generated/api/me/me'
import { MeFeedList200Data, ThreadDiscover200Data } from '@/generated/api/models'
import { getThreadDiscoverUrl } from '@/generated/api/threads/threads'

export interface FeedPage {
  items: MeFeedList200Data['items']
  nextCursor: string | null
}

// Signed-out visitors have no feed to fetch — the page decides what to show them instead.
export async function getFeedServer(): Promise<FeedPage | null> {
  const hasSession = await checkHasSession()
  if (!hasSession) return null

  const page = await apiClientServer<MeFeedList200Data>(getMeFeedListUrl({ limit: 20 }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}

export async function getDiscoverFeedServer(): Promise<FeedPage> {
  const page = await apiClientServer<ThreadDiscover200Data>(getThreadDiscoverUrl({ limit: 20 }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}
