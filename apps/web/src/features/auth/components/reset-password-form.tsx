'use client'

import { ConfirmPasswordResetForm } from '@/features/auth/components/confirm-password-reset-form'
import { RequestPasswordResetForm } from '@/features/auth/components/request-password-reset-form'
import { useSearchParams } from 'next/navigation'

export function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  return token ? <ConfirmPasswordResetForm token={token} /> : <RequestPasswordResetForm />
}
