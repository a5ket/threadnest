import { NestAvatar } from '@/common/components/nest-avatar'
import { SortTabLink } from '@/common/components/sort-tab-link'
import { JoinNestControl } from '@/features/nest/components/join-nest-control'
import { LeaveNestButton } from '@/features/nest/components/leave-nest-button'
import { NestManageMenu } from '@/features/nest/components/nest-manage-menu'
import { NestRightRail } from '@/features/nest/components/nest-right-rail'
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
  searchParams: Promise<{ sort?: string, q?: string }>
}) {
  const { nestSlug } = await params
  const { sort, q } = await searchParams
  const sortBy = sort === 'top' ? NestThreadListSortBy.score : NestThreadListSortBy.createdAt
  const search = q?.trim() || undefined

  const [nest, threadPage] = await Promise.all([
    getNestServer(nestSlug),
    getThreadsServer(nestSlug, sortBy, search)
  ])

  if (!nest) {
    notFound()
  }

  return (
    <div className='flex flex-col gap-6 p-6'>
      <NestRightRail
        name={nest.name}
        slug={nest.slug}
        description={nest.description}
        iconUrl={nest.iconUrl}
        visibility={nest.access.visibility}
        memberCount={nest.memberCount}
        threadCount={nest.threadCount}
        createdAt={nest.createdAt}
      />

      <div className='flex flex-wrap items-start justify-between gap-4'>
        <div className='flex items-start gap-3'>
          <NestAvatar name={nest.name} slug={nest.slug} iconUrl={nest.iconUrl} size={44} />

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
        </div>

        <div className='flex flex-wrap items-center gap-2'>
          <NestManageMenu
            links={[
              ...(nest.access.canViewMembers ? [{ href: `/n/${nestSlug}/members`, label: 'Members' }] : []),
              ...(nest.access.canManageInvites ? [{ href: `/n/${nestSlug}/invites`, label: 'Invites' }] : []),
              ...(nest.access.canManageJoinRequests ? [{ href: `/n/${nestSlug}/join-requests`, label: 'Join requests' }] : []),
              ...(nest.access.canManageBans ? [{ href: `/n/${nestSlug}/bans`, label: 'Bans' }] : []),
              ...(nest.access.canModerateContent ? [{ href: `/n/${nestSlug}/reports`, label: 'Reports' }] : []),
              ...(nest.access.canViewActionLog ? [{ href: `/n/${nestSlug}/action-logs`, label: 'Action log' }] : []),
              ...(nest.access.canModerateContent ? [{ href: `/n/${nestSlug}/settings`, label: 'Settings' }] : [])
            ]}
          />

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

      <form className='flex items-center gap-2'>
        {sort && <input type='hidden' name='sort' value={sort} />}
        <input
          type='search'
          name='q'
          defaultValue={q}
          placeholder='Search threads...'
          className='flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm'
        />
        <button type='submit' className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'>
          Search
        </button>
      </form>

      <div className='flex items-center gap-2'>
        <SortTabLink href={q ? `/n/${nestSlug}?q=${encodeURIComponent(q)}` : `/n/${nestSlug}`} active={sort !== 'top'}>
          New
        </SortTabLink>
        <SortTabLink href={`/n/${nestSlug}?sort=top${q ? `&q=${encodeURIComponent(q)}` : ''}`} active={sort === 'top'}>
          Top
        </SortTabLink>
      </div>

      <ThreadList nestSlug={nestSlug} sortBy={sortBy} search={search} initialPage={threadPage} />
    </div>
  )
}
