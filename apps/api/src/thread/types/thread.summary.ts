import { Prisma } from 'generated/prisma/client'
import { THREAD_SUMMARY_SELECT } from '../constants/thread.summary.select'

export type ThreadSummary = Prisma.ThreadGetPayload<{ select: typeof THREAD_SUMMARY_SELECT }>