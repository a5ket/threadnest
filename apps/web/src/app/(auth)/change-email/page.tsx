import { AuthCard } from '@/features/auth/components/auth-card'
import { ConfirmEmailChangeForm } from '@/features/auth/components/confirm-email-change-form'
import { Suspense } from 'react'

export default function ConfirmEmailChangePage() {
  return (
    <AuthCard>
      <Suspense>
        <ConfirmEmailChangeForm />
      </Suspense>
    </AuthCard>
  )
}
