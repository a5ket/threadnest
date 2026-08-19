'use client'

import { ConfirmDialog } from '@/common/components/confirm-dialog'
import { useState } from 'react'
import { useInvalidateUserSuspensionStatus, useSuspendUser, useUnsuspendUser, useUserSuspensionStatus } from '../platform-suspension.hooks'

interface SuspendUserControlProps {
  userId: string
}

export function SuspendUserControl({ userId }: SuspendUserControlProps) {
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [reason, setReason] = useState('')
  const [confirmingUnsuspend, setConfirmingUnsuspend] = useState(false)

  const { data, isLoading } = useUserSuspensionStatus(userId, true)
  const invalidate = useInvalidateUserSuspensionStatus(userId)

  const suspend = useSuspendUser({
    onSuccess: () => {
      setShowForm(false)
      setReason('')
      invalidate()
    },
    onError: (err) => {
      switch (err.errorCode) {
        case 'CANNOT_SUSPEND_YOURSELF':
          setError('You can\'t suspend yourself.')
          break

        case 'ALREADY_SUSPENDED':
          invalidate()
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to suspend this user.')
          break

        case 'USER_NOT_FOUND':
          setError('This user no longer exists.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  const unsuspend = useUnsuspendUser({
    onSuccess: () => invalidate(),
    onError: (err) => {
      switch (err.errorCode) {
        case 'SUSPENSION_NOT_FOUND':
          invalidate()
          break

        case 'INSUFFICIENT_PERMISSIONS':
          setError('You don\'t have permission to lift this suspension.')
          break

        default:
          setError('Something went wrong. Please try again.')
      }
    }
  })

  if (isLoading) {
    return <p className='text-sm text-muted-foreground'>Checking suspension status…</p>
  }

  if (data?.suspended) {
    return (
      <div className='flex flex-col gap-2 rounded-md border border-destructive/40 bg-destructive/5 p-3'>
        <div className='flex items-center justify-between gap-4'>
          <div>
            <p className='text-sm font-medium text-destructive'>Suspended</p>
            {data.reason && <p className='text-xs text-muted-foreground'>{data.reason}</p>}
          </div>

          <button
            type='button'
            disabled={unsuspend.isPending}
            onClick={() => setConfirmingUnsuspend(true)}
            className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
          >
            {unsuspend.isPending ? 'Lifting…' : 'Lift suspension'}
          </button>
        </div>

        {error && (
          <p role='alert' className='text-xs text-destructive'>{error}</p>
        )}

        <ConfirmDialog
          open={confirmingUnsuspend}
          title='Lift this suspension?'
          description='The user will be able to sign in again.'
          confirmLabel='Lift suspension'
          onCancel={() => setConfirmingUnsuspend(false)}
          onConfirm={() => {
            setConfirmingUnsuspend(false)
            setError(null)
            unsuspend.mutate({ userId })
          }}
        />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2'>
      {!showForm && (
        <button
          type='button'
          onClick={() => setShowForm(true)}
          className='self-start text-sm text-destructive hover:underline'
        >
          Suspend user
        </button>
      )}

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault()

            if (!reason.trim()) {
              setError('Enter a reason.')
              return
            }

            setError(null)
            suspend.mutate({ userId, reason: reason.trim() })
          }}
          className='flex flex-col gap-2'
        >
          <input
            type='text'
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder='Reason for suspension'
            autoComplete='off'
            className='rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring'
          />

          <div className='flex gap-2'>
            <button
              type='submit'
              disabled={suspend.isPending}
              className='rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:opacity-90 disabled:opacity-50'
            >
              {suspend.isPending ? 'Suspending…' : 'Suspend'}
            </button>

            <button
              type='button'
              onClick={() => {
                setShowForm(false)
                setError(null)
              }}
              className='rounded-md px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted'
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role='alert' className='text-sm text-destructive'>{error}</p>
      )}
    </div>
  )
}
