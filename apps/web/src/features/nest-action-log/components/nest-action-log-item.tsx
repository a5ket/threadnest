import { formatDateTime } from '@/common/format-date'
import Link from 'next/link'
import { getNestActionLogContent } from '../nest-action-log-content'
import type { NestActionLogEntry } from '../nest-action-log.types'

interface NestActionLogItemProps {
  log: NestActionLogEntry
  nestSlug: string
}

export function NestActionLogItem({ log, nestSlug }: NestActionLogItemProps) {
  const { text, href } = getNestActionLogContent(log, nestSlug)

  return (
    <li>
      <Link href={href} className='flex flex-col gap-0.5 px-3 py-2 text-sm hover:bg-muted'>
        <span className='text-foreground'>{text}</span>
        <span className='text-xs text-muted-foreground'>{formatDateTime(log.createdAt)}</span>
      </Link>
    </li>
  )
}
