import { formatDateTime } from '@/common/format-date'
import Link from 'next/link'
import { getPlatformActionLogContent } from '../platform-action-log-content'
import type { PlatformActionLogEntry } from '../platform-action-log.types'

interface PlatformActionLogItemProps {
  log: PlatformActionLogEntry
}

export function PlatformActionLogItem({ log }: PlatformActionLogItemProps) {
  const { text, href } = getPlatformActionLogContent(log)

  return (
    <li className='flex items-center justify-between gap-3 px-3 py-2 hover:bg-muted'>
      <Link href={href} className='flex min-w-0 flex-1 flex-col gap-0.5 text-sm'>
        <span className='text-foreground'>{text}</span>
        <span className='text-xs text-muted-foreground'>{formatDateTime(log.createdAt)}</span>
      </Link>

      {log.nest && (
        <Link
          href={`/admin/action-logs?nestId=${log.nest.id}&nestSlug=${log.nest.slug}`}
          className='shrink-0 rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground hover:opacity-80'
        >
          {log.nest.name}
        </Link>
      )}
    </li>
  )
}
