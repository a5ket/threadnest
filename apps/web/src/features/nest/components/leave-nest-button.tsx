'use client'

import { DeleteConfirmButton } from '@/common/components/delete-confirm-button'
import { useLeaveNest } from '@/features/me/me.hooks'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface LeaveNestButtonProps {
  nestSlug: string
}

export function LeaveNestButton({ nestSlug }: LeaveNestButtonProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const leaveNest = useLeaveNest({
    onSuccess: () => {
      router.push('/')
      router.refresh()
    },
    onError: (err) => {
      switch (err.errorCode) {
        case 'CANNOT_LEAVE_AS_OWNER':
          setError('Owners can\'t leave — transfer ownership first.')
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You can\'t leave this nest.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  return (
    <div className='flex flex-col items-end gap-1'>
      <DeleteConfirmButton
        label='Leave nest'
        isPending={leaveNest.isPending}
        onConfirm={() => {
          setError(null)
          leaveNest.mutate(nestSlug)
        }}
      />

      {error && (
        <p role='alert' className='text-xs text-destructive'>
          {error}
        </p>
      )}
    </div>
  )
}
