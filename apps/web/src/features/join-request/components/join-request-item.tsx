'use client'

import { BADGE_ACCENT_BORDER, Badge, type BadgeVariant } from '@/common/components/badge'
import { UserLink } from '@/common/components/user-link'
import { formatDateTime } from '@/common/format-date'
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

const STATUS_VARIANTS: Record<JoinRequest['status'], BadgeVariant> = {
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'destructive',
  CANCELED: 'neutral',
  EXPIRED: 'neutral'
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
    <li className={`flex items-center justify-between gap-4 rounded-lg border border-border border-l-4 bg-card p-3 ${BADGE_ACCENT_BORDER[STATUS_VARIANTS[request.status]]}`}>
      <div>
        <p className='text-sm font-medium'><UserLink user={request.user} /></p>
        <p className='mt-1 flex items-center gap-1.5 text-xs text-muted-foreground'>
          <Badge variant={STATUS_VARIANTS[request.status]} size='sm'>{STATUS_LABELS[request.status]}</Badge>
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
