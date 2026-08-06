import { JoinRequestList } from '@/features/join-request/components/join-request-list'
import { getNestJoinRequestsServer } from '@/features/join-request/join-request.server'
import { getNestServer } from '@/features/nest/nest.server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function NestJoinRequestsPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params

  const [nest, requests] = await Promise.all([
    getNestServer(nestSlug),
    getNestJoinRequestsServer(nestSlug)
  ])

  if (!nest || !nest.access.canManageJoinRequests) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
        ← Back to nest
      </Link>

      <h1 className='text-lg font-semibold'>
        {nest.name}
        {' join requests'}
      </h1>

      <JoinRequestList nestSlug={nestSlug} requests={requests} />
    </div>
  )
}
