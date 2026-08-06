export type ThreadPolicySubject = {
  id: string
  nestId: string
  authorId: string
  createdAt: Date
  deletedAt: Date | null
  deletedById: string | null
  lockedAt: Date | null
  pinnedAt: Date | null
}