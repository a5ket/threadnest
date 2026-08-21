import { JoinRequestList } from '@/features/join-request/components/join-request-list'
import { getNestJoinRequestsServer } from '@/features/join-request/join-request.server'
import { getNestServer } from '@/features/nest/nest.server'
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
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold'>Join requests</h2>

      <JoinRequestList nestSlug={nestSlug} requests={requests} />
    </div>
  )
}
