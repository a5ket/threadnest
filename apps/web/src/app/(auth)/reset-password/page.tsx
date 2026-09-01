import { AuthCard } from '@/features/auth/components/auth-card'
import { ResetPasswordForm } from '@/features/auth/components/reset-password-form'
import { Suspense } from 'react'

export default function ResetPasswordPage() {
  return (
    <AuthCard>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthCard>
  )
}
