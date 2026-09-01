import { AuthCard } from '@/features/auth/components/auth-card'
import { VerifyEmailForm } from '@/features/auth/components/verify-email-form'
import { Suspense } from 'react'

export default function VerifyEmailPage() {
  return (
    <AuthCard>
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </AuthCard>
  )
}
