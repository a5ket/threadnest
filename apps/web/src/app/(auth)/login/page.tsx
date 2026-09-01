'use client'

import { AuthCard } from '@/features/auth/components/auth-card'
import { LoginForm } from '@/features/auth/components/login-form'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return (
    <AuthCard>
      <LoginForm onAuthenticated={() => router.push('/')} />
    </AuthCard>
  )
}
