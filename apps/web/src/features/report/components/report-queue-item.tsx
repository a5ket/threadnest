'use client'

import { UserLink } from '@/common/components/user-link'
import { formatDateTime } from '@/common/format-date'
import { UserSummaryResponseDto } from '@/generated/api/models'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useDismissReport, useResolveReport } from '../report.hooks'
import type { Report } from '../report.types'

interface ReportQueueItemProps {
  nestSlug: string
  report: Report
}

// UserLink expects the nested `profile` shape; report reporter/resolvedBy come back flat.
function toUserReference(user: UserSummaryResponseDto) {
  return {
    id: user.id,
    profile: user.username ? { username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl } : null
  }
}

const REASON_LABELS: Record<Report['reason'], string> = {
  SPAM: 'Spam',
  HARASSMENT: 'Harassment',
  MISINFORMATION: 'Misinformation',
  RULE_VIOLATION: 'Rule violation',
  OTHER: 'Other'
}

const STATUS_LABELS: Record<Report['status'], string> = {
  PENDING: 'Pending',
  RESOLVED: 'Resolved',
  DISMISSED: 'Dismissed'
}

export function ReportQueueItem({ nestSlug, report }: ReportQueueItemProps) {
  const router = useRouter()

  const resolve = useResolveReport({ onSuccess: () => router.refresh() })
  const dismiss = useDismissReport({ onSuccess: () => router.refresh() })

  const isPending = resolve.isPending || dismiss.isPending

  return (
    <li className='flex flex-col gap-2 rounded-md border border-border p-3'>
      <div className='flex items-center gap-2 text-xs text-muted-foreground'>
        <span className='rounded-full bg-muted px-2 py-0.5 font-medium'>{REASON_LABELS[report.reason]}</span>
        <span>{STATUS_LABELS[report.status]}</span>
        <span>
          {'· Reported by '}
          <UserLink user={toUserReference(report.reporter)} />
          {' · '}
          {formatDateTime(report.createdAt)}
        </span>
      </div>

      {report.thread && (
        <Link href={`/n/${nestSlug}/t/${report.thread.slug}`} className='text-sm font-medium hover:underline'>
          {report.thread.title}
        </Link>
      )}

      {report.comment && (
        <div>
          <Link href={`/n/${nestSlug}/t/${report.comment.threadSlug}`} className='text-xs text-muted-foreground hover:underline'>
            {'Comment on '}
            {report.comment.threadTitle}
          </Link>
          <p className='mt-1 whitespace-pre-wrap text-sm'>{report.comment.content}</p>
        </div>
      )}

      {report.details && (
        <p className='text-sm text-muted-foreground'>{report.details}</p>
      )}

      {report.status === 'PENDING' && (
        <div className='flex gap-2'>
          <button
            type='button'
            disabled={isPending}
            onClick={() => resolve.mutate({ nestSlug, reportId: report.id })}
            className='rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-brand-hover disabled:opacity-50'
          >
            Resolve
          </button>

          <button
            type='button'
            disabled={isPending}
            onClick={() => dismiss.mutate({ nestSlug, reportId: report.id })}
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
