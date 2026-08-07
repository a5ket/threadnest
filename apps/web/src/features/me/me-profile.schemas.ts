import { MeProfileUpdateBody } from '@/generated/schemas/me/me'
import { z } from 'zod'

export const updateProfileSchema = MeProfileUpdateBody
export type UpdateProfileFormValues = z.infer<typeof updateProfileSchema>
