import { Prisma } from 'generated/prisma/client'
import { threadSummarySelect } from '../constants/thread.summary.select'

export type ThreadSummary = Prisma.ThreadGetPayload<{ select: ReturnType<typeof threadSummarySelect> }>
