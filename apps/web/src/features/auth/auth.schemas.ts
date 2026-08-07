import { AuthConfirmPasswordResetBody, AuthLoginBody, AuthRegisterBody, AuthRequestPasswordResetBody } from '@/generated/schemas/auth/auth'
import { z } from 'zod'

export const loginSchema = AuthLoginBody
export type LoginFormValues = z.infer<typeof loginSchema>

export const registerSchema = AuthRegisterBody
  .extend({
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })
export type RegisterFormValues = z.infer<typeof registerSchema>

export const requestPasswordResetSchema = AuthRequestPasswordResetBody
export type RequestPasswordResetFormValues = z.infer<typeof requestPasswordResetSchema>

export const confirmPasswordResetSchema = AuthConfirmPasswordResetBody
  .omit({ token: true })
  .extend({
    confirmPassword: z.string().min(1, 'Confirm your password')
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  })
export type ConfirmPasswordResetFormValues = z.infer<typeof confirmPasswordResetSchema>
