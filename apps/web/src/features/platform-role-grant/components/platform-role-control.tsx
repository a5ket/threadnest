'use client'

import { PlatformRoleGrantCreateDtoRole } from '@/generated/api/models'
import { useState } from 'react'
import {
  useActivePlatformRole,
  useChangePlatformRole,
  useGrantPlatformRole,
  useInvalidateActivePlatformRole,
  useRevokePlatformRole
} from '../platform-role-grant.hooks'

interface PlatformRoleControlProps {
  userId: string
}

const ROLE_OPTIONS = [PlatformRoleGrantCreateDtoRole.MODERATOR, PlatformRoleGrantCreateDtoRole.ADMIN]

export function PlatformRoleControl({ userId }: PlatformRoleControlProps) {
  const [error, setError] = useState<string | null>(null)
  const { data, isLoading } = useActivePlatformRole(userId, true)
  const invalidate = useInvalidateActivePlatformRole(userId)

  const onError = (err: { errorCode: string }) => {
    switch (err.errorCode) {
      case 'INSUFFICIENT_PERMISSIONS':
        setError('You don\'t have permission to manage platform roles.')
        break

      case 'USER_NOT_FOUND':
        setError('This user no longer exists.')
        break

      case 'GRANT_NOT_FOUND':
      case 'ALREADY_HAS_ACTIVE_ROLE':
        invalidate()
        break

      default:
        setError('Something went wrong. Please try again.')
    }
  }

  const grant = useGrantPlatformRole({ onSuccess: invalidate, onError })
  const change = useChangePlatformRole({ onSuccess: invalidate, onError })
  const revoke = useRevokePlatformRole({ onSuccess: invalidate, onError })

  const isPending = grant.isPending || change.isPending || revoke.isPending

  if (isLoading) {
    return <p className='text-sm text-muted-foreground'>Checking platform role…</p>
  }

  const currentRole = data?.role ?? null

  return (
    <div className='flex flex-col gap-1'>
      <div className='flex items-center gap-2'>
        <span className='text-sm text-muted-foreground'>Platform role:</span>

        <select
          value={currentRole ?? ''}
          disabled={isPending}
          onChange={(e) => {
            setError(null)
            const nextRole = e.target.value as PlatformRoleGrantCreateDtoRole | ''

            if (!nextRole) {
              revoke.mutate({ userId })
            }
            else if (!currentRole) {
              grant.mutate({ userId, role: nextRole })
            }
            else {
              change.mutate({ userId, role: nextRole })
            }
          }}
          className='rounded-md border border-input bg-background px-2 py-1 text-sm disabled:opacity-50'
        >
          <option value=''>None</option>
          {ROLE_OPTIONS.map((role) => (
            <option key={role} value={role}>{role}</option>
          ))}
        </select>
      </div>

      {error && (
        <p role='alert' className='text-xs text-destructive'>{error}</p>
      )}
    </div>
  )
}
