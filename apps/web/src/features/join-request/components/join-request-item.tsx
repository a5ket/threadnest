'use client'

import { formatDateTime } from '@/common/format-date'
import { getUserDisplayName } from '@/common/user-display-name'
import { useApproveJoinRequest, useRejectJoinRequest } from '@/features/join-request/join-request.hooks'
import type { JoinRequest } from '@/features/join-request/join-request.types'
import { useRouter } from 'next/navigation'

interface JoinRequestItemProps {
  nestSlug: string
  request: JoinRequest
}

const STATUS_LABELS: Record<JoinRequest['status'], string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  CANCELED: 'Cancelled',
  EXPIRED: 'Expired'
}

export function JoinRequestItem({ nestSlug, request }: JoinRequestItemProps) {
  const router = useRouter()

  const approve = useApproveJoinRequest({
    onSuccess: () => router.refresh()
  })

  const reject = useRejectJoinRequest({
    onSuccess: () => router.refresh()
  })

  const isPending = approve.isPending || reject.isPending

  return (
    <li className='flex items-center justify-between gap-4 rounded-md border border-border p-3'>
      <div>
        <p className='text-sm font-medium'>{getUserDisplayName(request.user)}</p>
        <p className='text-xs text-muted-foreground'>
          {STATUS_LABELS[request.status]}
          {' · '}
          {formatDateTime(request.createdAt)}
        </p>
      </div>

      {request.status === 'PENDING' && (
        <div className='flex gap-2'>
          <button
            type='button'
            disabled={isPending}
            onClick={() => approve.mutate({ nestSlug, requestId: request.id })}
            className='rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
          >
            Approve
          </button>

          <button
            type='button'
            disabled={isPending}
            onClick={() => reject.mutate({ nestSlug, requestId: request.id })}
            className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
          >
            Reject
          </button>
        </div>
      )}
    </li>
  )
}
