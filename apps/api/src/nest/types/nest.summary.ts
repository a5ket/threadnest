import { Prisma } from 'generated/prisma/client'
import { NEST_SUMMARY_SELECT } from '../selects/nest.summary.select'

export type NestSummary = Prisma.NestGetPayload<{ select: typeof NEST_SUMMARY_SELECT }>