'use client'

import { LoginForm } from '@/features/auth/components/login-form'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  return <LoginForm onAuthenticated={() => router.push('/')} />
}
