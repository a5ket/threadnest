import { InviteList } from '@/features/invite/components/invite-list'
import { getNestInvitesServer } from '@/features/invite/invite.server'
import { getNestServer } from '@/features/nest/nest.server'
import { notFound } from 'next/navigation'

export default async function NestInvitesPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params

  const [nest, invites] = await Promise.all([
    getNestServer(nestSlug),
    getNestInvitesServer(nestSlug)
  ])

  if (!nest || !nest.access.canManageInvites) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6'>
      <h2 className='text-lg font-semibold'>Invites</h2>

      <InviteList nestSlug={nestSlug} invites={invites} />
    </div>
  )
}
