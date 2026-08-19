import { Prisma } from 'generated/prisma/client'
import { MESSAGE_SELECT } from '../selects/message.select'

export type MessageSummary = Prisma.MessageGetPayload<{ select: typeof MESSAGE_SELECT }>
