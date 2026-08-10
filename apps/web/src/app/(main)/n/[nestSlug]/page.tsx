import { JoinNestControl } from '@/features/nest/components/join-nest-control'
import { LeaveNestButton } from '@/features/nest/components/leave-nest-button'
import { getNestServer } from '@/features/nest/nest.server'
import { NestPreferenceToggle } from '@/features/nest-preference/components/nest-preference-toggle'
import { ThreadList } from '@/features/thread/components/thread-list'
import { getThreadsServer } from '@/features/thread/thread.server'
import { NestThreadListSortBy } from '@/generated/api/models'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function NestPage({
  params,
  searchParams
}: {
  params: Promise<{ nestSlug: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { nestSlug } = await params
  const { sort } = await searchParams
  const sortBy = sort === 'top' ? NestThreadListSortBy.score : NestThreadListSortBy.createdAt

  const [nest, threadPage] = await Promise.all([
    getNestServer(nestSlug),
    getThreadsServer(nestSlug, sortBy)
  ])

  if (!nest) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <div className='flex items-start justify-between gap-4'>
        <div>
          <h1 className='text-lg font-semibold'>{nest.name}</h1>
          {nest.description && (
            <p className='text-sm text-muted-foreground'>{nest.description}</p>
          )}
          <p className='mt-1 text-xs text-muted-foreground'>
            {nest.memberCount ?? 0}
            {' members · '}
            {nest.threadCount ?? 0}
            {' threads'}
          </p>
        </div>

        <div className='flex items-center gap-4'>
          {nest.access.canViewMembers && (
            <Link href={`/n/${nestSlug}/members`} className='text-sm text-muted-foreground hover:underline'>
              Members
            </Link>
          )}

          {nest.access.canManageInvites && (
            <Link href={`/n/${nestSlug}/invites`} className='text-sm text-muted-foreground hover:underline'>
              Invites
            </Link>
          )}

          {nest.access.canManageJoinRequests && (
            <Link href={`/n/${nestSlug}/join-requests`} className='text-sm text-muted-foreground hover:underline'>
              Join requests
            </Link>
          )}

          {nest.access.canManageBans && (
            <Link href={`/n/${nestSlug}/bans`} className='text-sm text-muted-foreground hover:underline'>
              Bans
            </Link>
          )}

          {nest.access.canModerateContent && (
            <Link href={`/n/${nestSlug}/settings`} className='text-sm text-muted-foreground hover:underline'>
              Settings
            </Link>
          )}

          {!nest.access.isMember && (
            <JoinNestControl nestSlug={nestSlug} nestName={nest.name} joinPolicy={nest.access.joinPolicy} />
          )}

          {nest.access.isMember && (
            <NestPreferenceToggle nestSlug={nestSlug} />
          )}

          {nest.access.canLeaveNest && (
            <LeaveNestButton nestSlug={nestSlug} nestName={nest.name} />
          )}

          <Link
            href={`/n/${nestSlug}/t/new`}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'
          >
            New thread
          </Link>
        </div>
      </div>

      <div className='flex items-center gap-3 text-sm'>
        <Link
          href={`/n/${nestSlug}`}
          className={sort === 'top' ? 'text-muted-foreground hover:underline' : 'font-medium text-foreground'}
        >
          New
        </Link>
        <Link
          href={`/n/${nestSlug}?sort=top`}
          className={sort === 'top' ? 'font-medium text-foreground' : 'text-muted-foreground hover:underline'}
        >
          Top
        </Link>
      </div>

      <ThreadList nestSlug={nestSlug} sortBy={sortBy} initialPage={threadPage} />
    </div>
  )
}
