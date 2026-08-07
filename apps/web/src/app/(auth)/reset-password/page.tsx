import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'
import { Suspense } from 'react'

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  )
}
