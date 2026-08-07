import { ConfirmEmailChangeForm } from '@/features/auth/components/confirm-email-change-form'
import { Suspense } from 'react'

export default function ConfirmEmailChangePage() {
  return (
    <Suspense>
      <ConfirmEmailChangeForm />
    </Suspense>
  )
}
