import { Prisma } from 'generated/prisma/client'
import { threadDetailsSelect } from '../selects/thread.details.select'

export type ThreadDetails = Prisma.ThreadGetPayload<{ select: ReturnType<typeof threadDetailsSelect> }>
