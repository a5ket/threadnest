import { Prisma } from 'generated/prisma/client'
import { threadDetailsSelect } from '../constants/thread.details.select'

export type ThreadDetails = Prisma.ThreadGetPayload<{ select: ReturnType<typeof threadDetailsSelect> }>
