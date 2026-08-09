import { VoteType } from 'generated/prisma/enums'
import { computeVoteScoreDelta } from './vote-score'

describe('computeVoteScoreDelta', () => {
  it('adds 1 for a new upvote', () => {
    expect(computeVoteScoreDelta(null, VoteType.UPVOTE)).toBe(1)
  })

  it('subtracts 1 for a new downvote', () => {
    expect(computeVoteScoreDelta(null, VoteType.DOWNVOTE)).toBe(-1)
  })

  it('adds 2 when flipping from downvote to upvote', () => {
    expect(computeVoteScoreDelta(VoteType.DOWNVOTE, VoteType.UPVOTE)).toBe(2)
  })

  it('subtracts 2 when flipping from upvote to downvote', () => {
    expect(computeVoteScoreDelta(VoteType.UPVOTE, VoteType.DOWNVOTE)).toBe(-2)
  })

  it('is a no-op when re-casting the same upvote', () => {
    expect(computeVoteScoreDelta(VoteType.UPVOTE, VoteType.UPVOTE)).toBe(0)
  })

  it('is a no-op when re-casting the same downvote', () => {
    expect(computeVoteScoreDelta(VoteType.DOWNVOTE, VoteType.DOWNVOTE)).toBe(0)
  })

  it('subtracts 1 when removing an upvote', () => {
    expect(computeVoteScoreDelta(VoteType.UPVOTE, null)).toBe(-1)
  })

  it('adds 1 when removing a downvote', () => {
    expect(computeVoteScoreDelta(VoteType.DOWNVOTE, null)).toBe(1)
  })

  it('is a no-op when removing a vote that never existed', () => {
    expect(computeVoteScoreDelta(null, null)).toBe(0)
  })
})
