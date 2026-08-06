import { CommentUpdateBody, NestThreadCommentCreateBody } from '@/generated/schemas/comments/comments'
import { z } from 'zod'

export const createCommentSchema = NestThreadCommentCreateBody
export type CreateCommentFormValues = z.infer<typeof createCommentSchema>

export const updateCommentSchema = CommentUpdateBody
export type UpdateCommentFormValues = z.infer<typeof updateCommentSchema>
