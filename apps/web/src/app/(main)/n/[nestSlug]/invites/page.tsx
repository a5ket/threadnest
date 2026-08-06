import { InviteList } from '@/features/invite/components/invite-list'
import { getNestInvitesServer } from '@/features/invite/invite.server'
import { getNestServer } from '@/features/nest/nest.server'
import Link from 'next/link'
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
    <div className='flex flex-col gap-6 p-6'>
      <Link href={`/n/${nestSlug}`} className='text-sm text-muted-foreground hover:underline'>
        ← Back to nest
      </Link>

      <h1 className='text-lg font-semibold'>
        {nest.name}
        {' invites'}
      </h1>

      <InviteList nestSlug={nestSlug} invites={invites} />
    </div>
  )
}
