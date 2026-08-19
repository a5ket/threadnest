export interface ChatAccessContext {
  isParticipant: boolean
  canViewChat: boolean
  canSendMessage: boolean
  youBlockedThem: boolean
  blockedByThem: boolean
}
