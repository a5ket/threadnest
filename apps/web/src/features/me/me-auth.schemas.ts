import { MeAuthChangeEmailBody, MeAuthChangePasswordBody } from '@/generated/schemas/me/me'
import { z } from 'zod'

export const changePasswordSchema = MeAuthChangePasswordBody
  .extend({ confirmNewPassword: z.string() })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Passwords don\'t match',
    path: ['confirmNewPassword']
  })
export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

export const changeEmailSchema = MeAuthChangeEmailBody
export type ChangeEmailFormValues = z.infer<typeof changeEmailSchema>
