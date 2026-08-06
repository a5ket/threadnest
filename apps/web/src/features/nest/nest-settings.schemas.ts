import { NestSettingsUpdateBody } from '@/generated/schemas/nest-settings/nest-settings'
import { z } from 'zod'

export const updateNestSettingsSchema = NestSettingsUpdateBody
export type UpdateNestSettingsFormValues = z.infer<typeof updateNestSettingsSchema>
