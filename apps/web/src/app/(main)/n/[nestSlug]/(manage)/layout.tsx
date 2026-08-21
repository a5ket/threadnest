import { NestManageNav } from '@/features/nest/components/nest-manage-nav'
import { getNestServer } from '@/features/nest/nest.server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function NestManageLayout({
  params,
  children
}: {
  params: Promise<{ nestSlug: string }>
  children: React.ReactNode
}) {
  const { nestSlug } = await params
  const nest = await getNestServer(nestSlug)

  if (!nest) {
    notFound()
  }

  const links = [
    ...(nest.access.canViewMembers ? [{ href: `/n/${nestSlug}/members`, label: 'Members' }] : []),
    ...(nest.access.canManageInvites ? [{ href: `/n/${nestSlug}/invites`, label: 'Invites' }] : []),
    ...(nest.access.canManageJoinRequests ? [{ href: `/n/${nestSlug}/join-requests`, label: 'Join requests' }] : []),
    ...(nest.access.canManageBans ? [{ href: `/n/${nestSlug}/bans`, label: 'Bans' }] : []),
    ...(nest.access.canModerateContent ? [{ href: `/n/${nestSlug}/reports`, label: 'Reports' }] : []),
    ...(nest.access.canViewActionLog ? [{ href: `/n/${nestSlug}/action-logs`, label: 'Action log' }] : []),
    ...(nest.access.canModerateContent ? [{ href: `/n/${nestSlug}/settings`, label: 'Settings' }] : [])
  ]

  if (links.length === 0) {
    notFound()
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-6 md:flex-row md:gap-8'>
      <aside className='shrink-0 md:w-48'>
        <Link href={`/n/${nestSlug}`} className='mb-3 block px-3 text-sm text-muted-foreground hover:underline'>
          ← Back to nest
        </Link>

        <h1 className='mb-3 px-3 text-lg font-semibold'>{nest.name}</h1>

        <NestManageNav links={links} />
      </aside>

      <div className='min-w-0 flex-1'>
        {children}
      </div>
    </div>
  )
}
