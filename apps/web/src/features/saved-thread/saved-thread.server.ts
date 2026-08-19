import { apiClientServer } from '@/common/server-api-client'
import { getMeSavedThreadListUrl } from '@/generated/api/me/me'
import { MeSavedThreadList200Data } from '@/generated/api/models'

export interface SavedThreadListPage {
  items: MeSavedThreadList200Data['items']
  nextCursor: string | null
}

export async function getSavedThreadsServer(): Promise<SavedThreadListPage> {
  const page = await apiClientServer<MeSavedThreadList200Data>(getMeSavedThreadListUrl({ limit: 20 }))
  return { items: page.items, nextCursor: page.meta.nextCursor }
}
