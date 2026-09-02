'use client'

import { BADGE_ACCENT_BORDER, Badge, type BadgeVariant } from '@/common/components/badge'
import { UserLink } from '@/common/components/user-link'
import { formatDateTime } from '@/common/format-date'
import { UserSummaryResponseDto } from '@/generated/api/models'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDismissPlatformReport, useResolvePlatformReport } from '../platform-report.hooks'
import type { PlatformReport } from '../platform-report.types'

interface PlatformReportQueueItemProps {
  report: PlatformReport
}

// UserLink expects the nested `profile` shape; reporter/resolvedBy/targetUser come back flat.
function toUserReference(user: UserSummaryResponseDto) {
  return {
    id: user.id,
    profile: user.username ? { username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } : null
  }
}

const REASON_LABELS: Record<PlatformReport['reason'], string> = {
  ILLEGAL_CONTENT: 'Illegal content',
  BAN_EVASION: 'Ban evasion',
  SPAM_NETWORK: 'Spam network',
  HARASSMENT: 'Harassment',
  IMPERSONATION: 'Impersonation',
  PLATFORM_RULE_VIOLATION: 'Platform rule violation',
  OTHER: 'Other'
}

const STATUS_LABELS: Record<PlatformReport['status'], string> = {
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed'
}

const STATUS_VARIANTS: Record<PlatformReport['status'], BadgeVariant> = {
  PENDING: 'warning',
  RESOLVED: 'success',
  DISMISSED: 'neutral'
}

function TargetLink({ report }: { report: PlatformReport }) {
  if (report.targetType === 'NEST' && report.nest) {
    return (
      <Link href={`/n/${report.nest.slug}`} className='text-sm font-medium hover:underline'>
        {'Nest: '}
        {report.nest.name}
      </Link>
    )
  }

  if (report.targetType === 'USER' && report.targetUser) {
    return (
      <span className='text-sm font-medium'>
        {'User: '}
        <UserLink user={toUserReference(report.targetUser)} />
      </span>
    )
  }

  if (report.targetType === 'THREAD' && report.thread) {
    return (
      <Link href={`/n/${report.nest?.slug ?? ''}/t/${report.thread.slug}`} className='text-sm font-medium hover:underline'>
        {report.thread.title}
      </Link>
    )
  }

  if (report.targetType === 'COMMENT' && report.comment) {
    return (
      <div>
        <Link href={`/n/${report.nest?.slug ?? ''}/t/${report.comment.threadSlug}`} className='text-xs text-muted-foreground hover:underline'>
          {'Comment on '}
          {report.comment.threadTitle}
        </Link>
        <p className='mt-1 whitespace-pre-wrap text-sm'>{report.comment.content}</p>
      </div>
    )
  }

  return <span className='text-sm italic text-muted-foreground'>Target no longer available</span>
}

export function PlatformReportQueueItem({ report }: PlatformReportQueueItemProps) {
  const router = useRouter()

  const resolve = useResolvePlatformReport({ onSuccess: () => router.refresh() })
  const dismiss = useDismissPlatformReport({ onSuccess: () => router.refresh() })

  const isPending = resolve.isPending || dismiss.isPending

  return (
    <li className={`flex flex-col gap-2 rounded-lg border border-border border-l-4 bg-card p-3 ${BADGE_ACCENT_BORDER[STATUS_VARIANTS[report.status]]}`}>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <Badge>{REASON_LABELS[report.reason]}</Badge>
        <Badge variant={STATUS_VARIANTS[report.status]}>{STATUS_LABELS[report.status]}</Badge>
        <span>
          {'· Reported by '}
          <UserLink user={toUserReference(report.reporter)} />
          {' · '}
          {formatDateTime(report.createdAt)}
        </span>
      </div>

      <TargetLink report={report} />

      {report.details && (
        <p className='text-sm text-muted-foreground'>{report.details}</p>
      )}

      {report.status === 'PENDING' && (
        <div className='flex gap-2'>
          <button
            type='button'
            disabled={isPending}
            onClick={() => resolve.mutate(report.id)}
            className='rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
          >
            Resolve
          </button>

          <button
            type='button'
            disabled={isPending}
            onClick={() => dismiss.mutate(report.id)}
            className='rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50'
          >
            Dismiss
          </button>
        </div>
      )}

      {report.status !== 'PENDING' && report.resolvedBy && (
        <p className='text-xs text-muted-foreground'>
          {STATUS_LABELS[report.status]}
          {' by '}
          <UserLink user={toUserReference(report.resolvedBy)} />
          {report.resolvedAt && (
            <>
              {' · '}
              {formatDateTime(report.resolvedAt)}
            </>
          )}
        </p>
      )}
    </li>
  )
}
