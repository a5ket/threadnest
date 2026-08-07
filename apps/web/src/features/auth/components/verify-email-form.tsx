'use client'

import { useConfirmEmailVerification } from '@/features/auth/auth.hooks'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function VerifyEmailForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const attempted = useRef(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate: confirmEmailVerification, isSuccess } = useConfirmEmailVerification({
    onError: (err) => {
      switch (err.errorCode) {
        case 'TOKEN_NOT_FOUND':
        case 'TOKEN_EXPIRED':
        case 'TOKEN_SUPERSEDED':
        case 'TOKEN_ALREADY_REDEEMED':
          setError('This link is invalid or has expired. Request a new verification email from your account.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true
    confirmEmailVerification({ token })
  }, [token, confirmEmailVerification])

  if (!token) {
    return (
      <p role='alert' className='text-sm text-destructive'>
        This link is missing a token.
      </p>
    )
  }

  if (isSuccess) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <p className='text-sm'>Your email address has been verified.</p>
        <Link href='/' className='text-sm text-primary hover:underline'>Go home</Link>
      </div>
    )
  }

  if (error) {
    return (
      <div className='flex flex-col items-center gap-3 text-center'>
        <p role='alert' className='text-sm text-destructive'>{error}</p>
        <Link href='/' className='text-sm text-primary hover:underline'>Go home</Link>
      </div>
    )
  }

  return (
    <p className='text-sm text-muted-foreground'>Verifying your email address...</p>
  )
}
