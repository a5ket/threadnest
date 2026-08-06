export type PaginatedResponse<T> = {
  items: T[]
  meta: {
    nextCursor: string | null
    hasMore: boolean
  }
}
