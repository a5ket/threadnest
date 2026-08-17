import { NestActionLogList } from '@/features/nest-action-log/components/nest-action-log-list'
import { getNestActionLogsServer } from '@/features/nest-action-log/nest-action-log.server'
import { getNestServer } from '@/features/nest/nest.server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function NestActionLogsPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params

  const [nest, page] = await Promise.all([
    getNestServer(nestSlug),
    getNestActionLogsServer(nestSlug)
  ])

  if (!nest || !nest.access.canViewActionLog) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
        ← Back to nest
      </Link>

      <h1 className='text-lg font-semibold'>
        {nest.name}
        {' action log'}
      </h1>

      <NestActionLogList nestSlug={nestSlug} initialPage={page} />
    </div>
  )
}
