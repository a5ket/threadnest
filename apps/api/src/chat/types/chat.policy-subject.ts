export type ChatPolicySubject = {
  id: string
  isGroup: boolean
  participants: {
    userId: string
    archivedAt: Date | null
    clearedAt: Date | null
  }[]
}
