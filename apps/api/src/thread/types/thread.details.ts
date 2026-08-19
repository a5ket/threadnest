import { VoteType } from 'generated/prisma/enums'
import { Prisma } from 'generated/prisma/client'
import { threadDetailsSelect } from '../selects/thread.details.select'

export type ThreadDetailsRaw = Prisma.ThreadGetPayload<{ select: ReturnType<typeof threadDetailsSelect> }>
export type ThreadDetails = Omit<ThreadDetailsRaw, 'threadVotes' | 'savedBy'> & { viewerVote: VoteType | null, viewerSaved: boolean }
