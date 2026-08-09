import { VoteType } from 'generated/prisma/enums'

const VOTE_WEIGHT: Record<VoteType, number> = {
  UPVOTE: 1,
  DOWNVOTE: -1,
}

export function computeVoteScoreDelta(from: VoteType | null, to: VoteType | null): number {
  const fromWeight = from ? VOTE_WEIGHT[from] : 0
  const toWeight = to ? VOTE_WEIGHT[to] : 0
  
  return toWeight - fromWeight
}
