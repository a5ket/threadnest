import { NestThreadCreateBody, NestThreadUpdateBody } from '@/generated/schemas/threads/threads'
import { z } from 'zod'

export const createThreadSchema = NestThreadCreateBody
export type CreateThreadFormValues = z.infer<typeof createThreadSchema>

export const updateThreadSchema = NestThreadUpdateBody
export type UpdateThreadFormValues = z.infer<typeof updateThreadSchema>
