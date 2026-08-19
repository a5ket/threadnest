import { Prisma } from 'generated/prisma/client'
import { chatSummarySelect } from '../selects/chat.summary.select'

export type ChatSummaryRaw = Prisma.ChatGetPayload<{ select: ReturnType<typeof chatSummarySelect> }>
