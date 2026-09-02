import { VoteType } from 'generated/prisma/enums'

const VOTE_WEIGHT: Record<VoteType, number> = {
  UPVOTE: 1,
  DOWNVOTE: -1,
}

/**
 * The change to apply to a stored vote-score counter when a vote changes — computed as a delta
 * rather than recounting all votes, since a thread/comment's score is a running total, not
 * recomputed from scratch on every vote.
 *
 * @param from - The vote's previous state, or `null` if there wasn't one.
 * @param to - The vote's new state, or `null` if it was removed.
 * @returns The signed delta to add to the score (e.g. `+2` for downvote → upvote, `-1` for upvote → none).
 */
export function computeVoteScoreDelta(from: VoteType | null, to: VoteType | null): number {
  const fromWeight = from ? VOTE_WEIGHT[from] : 0
  const toWeight = to ? VOTE_WEIGHT[to] : 0
  
  return toWeight - fromWeight
}
