import { NestThreadCreateBody } from '@/generated/schemas/threads/threads'
import { z } from 'zod'

export const createThreadSchema = NestThreadCreateBody
export type CreateThreadFormValues = z.infer<typeof createThreadSchema>
