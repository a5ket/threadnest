'use client'

import { AuthCard } from '@/features/auth/components/auth-card'
import { RegisterForm } from '@/features/auth/components/register-form'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  return (
    <AuthCard>
      <RegisterForm onAuthenticated={() => router.push('/')} />
    </AuthCard>
  )
}
