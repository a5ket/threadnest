import { RoleBadge } from '@/common/components/role-badge'
import { getUserDisplayName } from '@/common/user-display-name'
import { getNestServer } from '@/features/nest/nest.server'
import { getThreadsServer } from '@/features/thread/thread.server'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function NestPage({
  params
}: {
  params: Promise<{ nestSlug: string }>
}) {
  const { nestSlug } = await params

  const [nest, threads] = await Promise.all([
    getNestServer(nestSlug),
    getThreadsServer(nestSlug)
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
          {nest.access.canModerateContent && (
            <Link href={`/n/${nestSlug}/settings`} className='text-sm text-muted-foreground hover:underline'>
              Settings
            </Link>
          )}

          <Link
            href={`/n/${nestSlug}/t/new`}
            className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'
          >
            New thread
          </Link>
        </div>
      </div>

      <ul className='flex flex-col gap-3'>
        {threads.map((thread) => (
          <li key={thread.id} className='rounded-md border border-border p-3'>
            <div className='flex items-center gap-2'>
              {thread.pinnedAt && (
                <span className='rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground'>
                  Pinned
                </span>
              )}
              {thread.lockedAt && (
                <span className='rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'>
                  Locked
                </span>
              )}
              <Link href={`/n/${nestSlug}/t/${thread.slug}`} className='font-medium hover:underline'>
                {thread.title}
              </Link>
            </div>

            <p className='flex items-center gap-2 text-sm text-muted-foreground'>
              <span>{getUserDisplayName(thread.author)}</span>
              <RoleBadge role={thread.author.role} />
              <span>
                {' · '}
                {thread.commentCount}
                {' comments'}
              </span>
            </p>
          </li>
        ))}

        {threads.length === 0 && (
          <p className='text-sm text-muted-foreground'>No threads yet.</p>
        )}
      </ul>
    </div>
  )
}
