import { VoteType } from 'generated/prisma/enums'
import { Prisma } from 'generated/prisma/client'
import { threadSummarySelect } from '../selects/thread.summary.select'

export type ThreadSummaryRaw = Prisma.ThreadGetPayload<{ select: ReturnType<typeof threadSummarySelect> }>
export type ThreadSummary = Omit<ThreadSummaryRaw, 'threadVotes'> & { viewerVote: VoteType | null }
