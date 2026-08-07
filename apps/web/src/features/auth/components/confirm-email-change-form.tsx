'use client'

import { useConfirmEmailChange } from '@/features/auth/auth.hooks'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export function ConfirmEmailChangeForm() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const attempted = useRef(false)
  const [error, setError] = useState<string | null>(null)

  const { mutate: confirmEmailChange, isSuccess } = useConfirmEmailChange({
    onError: (err) => {
      switch (err.errorCode) {
        case 'TOKEN_NOT_FOUND':
        case 'TOKEN_EXPIRED':
        case 'TOKEN_SUPERSEDED':
        case 'TOKEN_ALREADY_REDEEMED':
          setError('This link is invalid or has expired. Request a new email change from your account settings.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  useEffect(() => {
    if (!token || attempted.current) return
    attempted.current = true
    confirmEmailChange({ token })
  }, [token, confirmEmailChange])

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
        <p className='text-sm'>Your email address has been updated.</p>
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
    <p className='text-sm text-muted-foreground'>Confirming your new email address...</p>
  )
}
