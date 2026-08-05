import { NestCreateBody } from '@/generated/schemas/nests/nests'
import { z } from 'zod'

export const createNestSchema = NestCreateBody
export type CreateNestFormValues = z.infer<typeof createNestSchema>
