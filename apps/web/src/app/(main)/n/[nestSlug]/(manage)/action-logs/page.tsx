import { NestActionLogList } from '@/features/nest-action-log/components/nest-action-log-list'
import { getNestActionLogsServer } from '@/features/nest-action-log/nest-action-log.server'
import { getNestServer } from '@/features/nest/nest.server'
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
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold'>Action log</h2>

      <NestActionLogList nestSlug={nestSlug} initialPage={page} />
    </div>
  )
}
