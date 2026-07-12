import { Prisma } from 'generated/prisma/client'
import { THREAD_DETAILS_SELECT } from '../constants/thread.details.select'

export type ThreadDetails = Prisma.ThreadGetPayload<{ select: typeof THREAD_DETAILS_SELECT }>