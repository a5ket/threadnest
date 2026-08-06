import { NestThreadCommentCreateBody } from '@/generated/schemas/comments/comments'
import { z } from 'zod'

export const createCommentSchema = NestThreadCommentCreateBody
export type CreateCommentFormValues = z.infer<typeof createCommentSchema>
