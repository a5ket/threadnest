import { Prisma } from 'generated/prisma/client'
import { threadSummarySelect } from '../selects/thread.summary.select'

export type ThreadSummary = Prisma.ThreadGetPayload<{ select: ReturnType<typeof threadSummarySelect> }>
