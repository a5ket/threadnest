import { DiscoverFeedList } from '@/features/feed/components/discover-feed-list'
import { FeedList } from '@/features/feed/components/feed-list'
import { getDiscoverFeedServer, getFeedServer } from '@/features/feed/feed.server'
import Link from 'next/link'

export default async function Home() {
  const page = await getFeedServer()

  if (page && page.items.length > 0) {
    return (
      <div className='flex flex-col gap-6 p-6'>
        <h1 className='text-lg font-semibold'>Your feed</h1>

        <FeedList initialPage={page} />
      </div>
    )
  }

  const discoverPage = await getDiscoverFeedServer()

  return (
    <div className='flex flex-col gap-6 p-6'>
      {!page && (
        <div className='flex flex-col items-center gap-4 rounded-lg border border-border bg-card p-8 text-center'>
          <h1 className='text-lg font-semibold'>Welcome to ThreadNest</h1>
          <p className='text-sm text-muted-foreground'>Sign in and join a nest to build your own personalized feed.</p>
          <div className='flex gap-3'>
            <Link href='/login' className='rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-brand-hover'>
              Sign in
            </Link>
            <Link href='/discover' className='rounded-md border border-input px-4 py-2 text-sm'>
              Discover nests
            </Link>
          </div>
        </div>
      )}

      {page && (
        <p className='text-sm text-muted-foreground'>
          No posts yet. Join a nest to see its threads here —
          {' '}
          <Link href='/discover' className='text-primary hover:underline'>discover nests</Link>
          .
        </p>
      )}

      <div className='flex flex-col gap-3'>
        <h2 className='text-sm font-semibold text-muted-foreground'>Popular right now</h2>
        <DiscoverFeedList initialPage={discoverPage} />
      </div>
    </div>
  )
}
