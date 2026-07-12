export type CommentPolicySubject = {
  id: string
  threadId: string
  authorId: string
  deletedAt: Date | null
  deletedById: string | null
}
