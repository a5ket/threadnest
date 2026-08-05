'use client'

import { RegisterForm } from '@/features/auth/components/register-form'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const router = useRouter()

  return <RegisterForm onAuthenticated={() => router.push('/')} />
}
